import { getSourcesByType } from '../config/sources.js';
import { buildCommentItems, normalizeTinyfishResult } from './normalization.service.js';
import { analyzeComparisonSentiment } from './sentiment.service.js';
import { fetchSocialComments } from './comments/social-comments.service.js';
import { runTinyfishAutomation } from './tinyfish.service.js';
import { comparisonStore } from './comparison-store.service.js';
import { cache } from './cache.service.js';
import { logger } from '../utils/logger.js';

function createComparisonId() {
  return `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildCacheKey(payload) {
  return JSON.stringify(payload);
}

function inferSourceType(source) {
  return source.id === 'marketwatch-search' ? 'financial' : 'news';
}

async function runSource({ source, query, companyA, companyB, comparisonId, onProgress }) {
  onProgress(`Scraping ${source.label}`);
  const startedSourceAt = Date.now();

  try {
    const runResult = await runTinyfishAutomation({
      url: source.buildUrl ? source.buildUrl(query, companyA.name, companyB.name) : source.url,
      goal: source.goal(query, companyA.name, companyB.name),
    });

    const normalizedItems = normalizeTinyfishResult(runResult, {
      ...source,
      sourceType: inferSourceType(source),
    });

    onProgress(`Collected ${normalizedItems.length} items from ${source.label}`);
    logger.info('Source scrape completed', { comparisonId, source: source.id, itemCount: normalizedItems.length });
    return {
      evidence: normalizedItems,
      sourceResult: {
        sourceId: source.id,
        label: source.label,
        sourceType: inferSourceType(source),
        status: 'success',
        itemCount: normalizedItems.length,
        durationMs: Date.now() - startedSourceAt,
      },
    };
  } catch (error) {
    onProgress(`Skipping ${source.label}: ${error.message}`);
    logger.warn('Source scrape failed', { comparisonId, source: source.id, message: error.message });
    return {
      evidence: [],
      sourceResult: {
        sourceId: source.id,
        label: source.label,
        sourceType: inferSourceType(source),
        status: error.statusCode === 504 ? 'timeout' : 'failed',
        itemCount: 0,
        durationMs: Date.now() - startedSourceAt,
        error: error.message,
      },
    };
  }
}

export async function analyzeComparison(payload) {
  const {
    query,
    companyA,
    companyB,
    includeComments = true,
    sources = ['news', 'financial', 'social'],
  } = payload;

  const timeline = [];
  const onProgress = (message) => {
    timeline.push(message);
  };
  const startedAt = Date.now();

  const cacheKey = buildCacheKey({ query, companyA, companyB, includeComments, sources });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info('Comparison analysis cache hit', { query, companyA: companyA.id, companyB: companyB.id });
    return cached;
  }

  const comparisonId = createComparisonId();
  const selectedSources = getSourcesByType(sources.filter((type) => type !== 'social'));
  const evidence = [];
  const sourceResults = [];

  onProgress(`Starting analysis for ${query}`);
  logger.info('Comparison analysis started', { comparisonId, query, sourceCount: selectedSources.length, includeComments });

  const sourceRunResults = await Promise.all(
    selectedSources.map((source) => runSource({ source, query, companyA, companyB, comparisonId, onProgress })),
  );
  evidence.push(...sourceRunResults.flatMap((result) => result.evidence));
  sourceResults.push(...sourceRunResults.map((result) => result.sourceResult));

  if (includeComments && sources.includes('social')) {
    const socialResult = await fetchSocialComments({
      query,
      companyA,
      companyB,
      onProgress,
    });
    evidence.push(...socialResult.evidence);
    sourceResults.push(...socialResult.sourceResults);
  }

  if (evidence.length === 0) {
    logger.warn('Comparison analysis produced no evidence', { comparisonId, query });
  }

  let results;
  if (evidence.length === 0) {
    onProgress('No evidence collected, skipping sentiment analysis');
    results = {
      [companyA.id]: {
        sentiment: 0.5,
        confidence: 0.2,
        key_reason: `No usable evidence was collected for ${companyA.name}.`,
      },
      [companyB.id]: {
        sentiment: 0.5,
        confidence: 0.2,
        key_reason: `No usable evidence was collected for ${companyB.name}.`,
      },
      summary: {
        winner: 'tie',
        overview: `No usable evidence was collected for ${companyA.name} versus ${companyB.name}.`,
      },
    };
  } else {
    onProgress(`Running sentiment analysis across ${evidence.length} evidence items`);
    results = await analyzeComparisonSentiment({ companyA, companyB, evidence });
  }
  const comments = buildCommentItems(evidence);
  const successCount = sourceResults.filter((item) => item.status === 'success').length;
  const timeoutCount = sourceResults.filter((item) => item.status === 'timeout').length;
  const failureCount = sourceResults.filter((item) => item.status === 'failed').length;
  const totalDurationMs = Date.now() - startedAt;
  onProgress(`Completed analysis: ${successCount} sources succeeded, ${timeoutCount} timed out, ${failureCount} failed`);

  const response = {
    comparisonId,
    query,
    companyA,
    companyB,
    results,
    comments,
    evidence,
    sourceResults,
    timeline,
    meta: {
      sourcesUsed: evidence.length,
      generatedAt: new Date().toISOString(),
      commentCount: comments.length,
      sourceCount: sourceResults.length,
      successfulSources: successCount,
      timedOutSources: timeoutCount,
      failedSources: failureCount,
      durationMs: totalDurationMs,
      partial: failureCount > 0 || timeoutCount > 0,
    },
  };

  logger.info('Comparison analysis completed', {
    comparisonId,
    durationMs: totalDurationMs,
    evidenceCount: evidence.length,
    successCount,
    timeoutCount,
    failureCount,
  });
  comparisonStore.save(comparisonId, response);
  cache.set(cacheKey, response);

  return response;
}

export async function refreshComments({ comparisonId, platforms = [] }) {
  const comparison = comparisonStore.get(comparisonId);
  if (!comparison) {
    return null;
  }

  const refreshStartedAt = Date.now();
  const socialResult = await fetchSocialComments({
    query: comparison.query,
    companyA: comparison.companyA,
    companyB: comparison.companyB,
    platforms,
  });

  const comments = buildCommentItems(socialResult.evidence);
  const updated = {
    ...comparison,
    comments,
    latestCommentRefreshAt: new Date().toISOString(),
    commentSourceResults: socialResult.sourceResults,
  };

  logger.info('Comments refresh completed', {
    comparisonId,
    durationMs: Date.now() - refreshStartedAt,
    commentCount: comments.length,
    sourceCount: socialResult.sourceResults.length,
  });
  comparisonStore.save(comparisonId, updated);
  return updated;
}
