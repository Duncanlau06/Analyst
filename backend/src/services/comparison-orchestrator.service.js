import { getSourcesByType } from '../config/sources.js';
import { buildCommentItems, normalizeTinyfishResult } from './normalization.service.js';
import { analyzeComparisonSentiment } from './sentiment.service.js';
import { fetchSocialComments } from './comments/social-comments.service.js';
import { runTinyfishAutomation } from './tinyfish.service.js';
import { comparisonStore } from './comparison-store.service.js';
import { cache } from './cache.service.js';

function createComparisonId() {
  return `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildCacheKey(payload) {
  return JSON.stringify(payload);
}

function inferSourceType(source) {
  return source.id === 'yahoo-finance' ? 'financial' : 'news';
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

  const cacheKey = buildCacheKey({ query, companyA, companyB, includeComments, sources });
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const comparisonId = createComparisonId();
  const selectedSources = getSourcesByType(sources.filter((type) => type !== 'social'));
  const evidence = [];

  onProgress(`Starting analysis for ${query}`);

  for (const source of selectedSources) {
    onProgress(`Scraping ${source.label}`);
    const runResult = await runTinyfishAutomation({
      url: source.url,
      goal: source.goal(query, companyA.name, companyB.name),
    });

    evidence.push(
      ...normalizeTinyfishResult(runResult, {
        ...source,
        sourceType: inferSourceType(source),
      }),
    );
  }

  if (includeComments && sources.includes('social')) {
    const socialEvidence = await fetchSocialComments({
      query,
      companyA,
      companyB,
      onProgress,
    });
    evidence.push(...socialEvidence);
  }

  onProgress(`Running sentiment analysis across ${evidence.length} evidence items`);
  const results = await analyzeComparisonSentiment({ companyA, companyB, evidence });
  const comments = buildCommentItems(evidence);

  const response = {
    comparisonId,
    query,
    companyA,
    companyB,
    results,
    comments,
    evidence,
    timeline,
    meta: {
      sourcesUsed: evidence.length,
      generatedAt: new Date().toISOString(),
      commentCount: comments.length,
    },
  };

  comparisonStore.save(comparisonId, response);
  cache.set(cacheKey, response);

  return response;
}

export async function refreshComments({ comparisonId, platforms = [] }) {
  const comparison = comparisonStore.get(comparisonId);
  if (!comparison) {
    return null;
  }

  const freshEvidence = await fetchSocialComments({
    query: comparison.query,
    companyA: comparison.companyA,
    companyB: comparison.companyB,
    platforms,
  });

  const comments = buildCommentItems(freshEvidence);
  const updated = {
    ...comparison,
    comments,
    latestCommentRefreshAt: new Date().toISOString(),
  };

  comparisonStore.save(comparisonId, updated);
  return updated;
}
