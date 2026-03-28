import { env } from '../config/env.js';
import { getRankedSourcesByType } from '../config/sources.js';
import { buildCommentItems, normalizeTinyfishResult } from './normalization.service.js';
import { analyzeComparisonSentiment, analyzeComparisonWithoutEvidence } from './sentiment.service.js';
import { buildNoEvidenceComparisonResult, formatComparisonResultForFrontend } from './scoring.service.js';
import { fetchSocialComments } from './comments/social-comments.service.js';
import { getTinyfishRunsBatch, startTinyfishAutomation, cancelTinyfishRunsBatch } from './tinyfish.service.js';
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRunStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'completed';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'CANCELLED') return 'cancelled';
  if (normalized === 'RUNNING') return 'running';
  if (normalized === 'PENDING') return 'pending';
  return 'unknown';
}

function createSourceTask(source, query, companyA, companyB) {
  const sourceType = source.platform ? 'social' : inferSourceType(source);
  return {
    source,
    sourceId: source.id,
    label: source.label,
    sourceType,
    platform: source.platform || null,
    url: source.buildUrl ? source.buildUrl(query, companyA.name, companyB.name) : `${source.url}${encodeURIComponent(query)}`,
    goal: source.goal(query, companyA.name, companyB.name),
  };
}

function finalizeCompletedTask({ task, run, startedAt, comparisonId, onProgress }) {
  const normalizedItems = normalizeTinyfishResult(run, {
    ...task.source,
    sourceType: task.sourceType,
  });

  onProgress(`Collected ${normalizedItems.length} items from ${task.label}`);
  logger.info('Source scrape completed', { comparisonId, source: task.sourceId, itemCount: normalizedItems.length });
  return {
    evidence: normalizedItems,
    sourceResult: {
      sourceId: task.sourceId,
      label: task.label,
      sourceType: task.sourceType,
      platform: task.platform,
      status: 'success',
      itemCount: normalizedItems.length,
      durationMs: Date.now() - startedAt,
    },
  };
}

function finalizeErroredTask({ task, startedAt, comparisonId, onProgress, status, error }) {
  onProgress(`Skipping ${task.label}: ${error}`);
  logger.warn('Source scrape failed', { comparisonId, source: task.sourceId, message: error });
  return {
    evidence: [],
    sourceResult: {
      sourceId: task.sourceId,
      label: task.label,
      sourceType: task.sourceType,
      platform: task.platform,
      status,
      itemCount: 0,
      durationMs: Date.now() - startedAt,
      error,
    },
  };
}

async function startTaskRun({ task, comparisonId, onProgress }) {
  const startedAt = Date.now();
  onProgress(`Queueing ${task.label}`);

  try {
    const startResponse = await startTinyfishAutomation({
      url: task.url,
      goal: task.goal,
      timeoutMs: 10000,
      browserProfile: 'lite',
    });

    const runId = startResponse.run_id || startResponse.id || startResponse.runId;
    if (!runId) {
      throw new Error('TinyFish did not return a run_id');
    }

    onProgress(`Started ${task.label}`);
    return { startedAt, task, runId, status: 'queued' };
  } catch (error) {
    return {
      startedAt,
      task,
      status: 'resolved',
      result: finalizeErroredTask({
        task,
        startedAt,
        comparisonId,
        onProgress,
        status: error.statusCode === 504 ? 'timeout' : 'failed',
        error: error.message,
      }),
    };
  }
}

async function runSelectedSources({ query, companyA, companyB, comparisonId, includeComments, sources, onProgress }) {
  const selectedSocialSources = sources.includes('social')
    ? getRankedSourcesByType(['social'], env.analysisMaxSocialSources)
    : [];
  const selectedStandardSources = getRankedSourcesByType(
    sources.filter((type) => type !== 'social'),
    env.analysisMaxSources,
  );

  const tasks = [
    // Prioritize social media sources - scrape these first
    ...(includeComments ? selectedSocialSources.map((source) => createSourceTask(source, query, companyA, companyB)) : []),
    ...selectedStandardSources.map((source) => createSourceTask(source, query, companyA, companyB)),
  ];

  // Start tasks in batches to avoid overwhelming TinyFish queue
  const runStates = [];
  const batchSize = 2;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((task) => startTaskRun({ task, comparisonId, onProgress })));
    runStates.push(...batchResults);
    // Small delay between batches to give TinyFish time to allocate workers
    if (i + batchSize < tasks.length) {
      await sleep(500);
    }
  }

  const deadlineAt = Date.now() + env.analysisPollBudgetMs;

  while (Date.now() < deadlineAt) {
    const pendingStates = runStates.filter((state) => state.status === 'queued');
    if (pendingStates.length === 0) {
      break;
    }

    await sleep(env.analysisPollIntervalMs);

    let batchResponse;
    try {
      batchResponse = await getTinyfishRunsBatch({
        runIds: pendingStates.map((state) => state.runId),
        timeoutMs: 10000,
      });
    } catch (error) {
      logger.warn('TinyFish batch polling failed', { comparisonId, message: error.message });
      break;
    }

    const runs = Array.isArray(batchResponse?.data)
      ? batchResponse.data
      : Array.isArray(batchResponse?.runs)
        ? batchResponse.runs
        : Array.isArray(batchResponse)
          ? batchResponse
          : [];
    const runsById = new Map(runs.map((run) => [run.run_id || run.id, run]));

    for (const state of pendingStates) {
      const run = runsById.get(state.runId);
      if (!run) {
        continue;
      }

      const status = normalizeRunStatus(run.status);
      if (status === 'completed') {
        state.status = 'resolved';
        state.result = finalizeCompletedTask({
          task: state.task,
          run,
          startedAt: state.startedAt,
          comparisonId,
          onProgress,
        });
      } else if (status === 'failed' || status === 'cancelled') {
        state.status = 'resolved';
        state.result = finalizeErroredTask({
          task: state.task,
          startedAt: state.startedAt,
          comparisonId,
          onProgress,
          status: 'failed',
          error: run.error || `TinyFish run ${status}`,
        });
      }
    }
  }

  // Cancel any remaining pending/running tasks
  const stillPendingStates = runStates.filter((state) => state.status === 'queued');
  if (stillPendingStates.length > 0) {
    const pendingRunIds = stillPendingStates.map((state) => state.runId);
    onProgress(`Cancelling ${stillPendingStates.length} incomplete scraping tasks...`);
    logger.info('Cancelling pending TinyFish runs', { comparisonId, runCount: pendingRunIds.length });
    await cancelTinyfishRunsBatch({ runIds: pendingRunIds });
    
    // Mark cancelled tasks as resolved with timeout status
    for (const state of stillPendingStates) {
      state.status = 'resolved';
      state.result = finalizeErroredTask({
        task: state.task,
        startedAt: state.startedAt,
        comparisonId,
        onProgress,
        status: 'timeout',
        error: `Analysis deadline exceeded - scraping cancelled`,
      });
    }
  }

  const settledResults = runStates.map((state) => {
    if (state.result) {
      return state.result;
    }

    return finalizeErroredTask({
      task: state.task,
      startedAt: state.startedAt,
      comparisonId,
      onProgress,
      status: 'timeout',
      error: `TinyFish run did not complete within ${env.analysisPollBudgetMs}ms`,
    });
  });

  return {
    evidence: settledResults.flatMap((result) => result.evidence),
    sourceResults: settledResults.map((result) => result.sourceResult),
  };
}

export async function analyzeComparison(payload) {
  const {
    query,
    companyA,
    companyB,
    includeComments = true,
    sources = ['social'],
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

  onProgress(`Starting analysis for ${query}`);
  logger.info('Comparison analysis started', { comparisonId, query, sourceTypes: sources, includeComments });

  const { evidence, sourceResults } = await runSelectedSources({
    query,
    companyA,
    companyB,
    comparisonId,
    includeComments,
    sources,
    onProgress,
  });

  if (evidence.length === 0) {
    logger.warn('Comparison analysis produced no evidence', { comparisonId, query });
  }

  let rawResult;
  let fallbackMode = null;
  if (evidence.length === 0) {
    if (env.tinyfishOnlyMode) {
      onProgress('No TinyFish evidence completed in time; returning TinyFish-only timeout result');
      rawResult = buildNoEvidenceComparisonResult({
        companyA,
        companyB,
        waitMs: env.analysisPollBudgetMs,
      });
      fallbackMode = 'tinyfish_timeout';
    } else {
      onProgress('No evidence collected from TinyFish, using fast model fallback');
      rawResult = await analyzeComparisonWithoutEvidence({ companyA, companyB, query });
      fallbackMode = 'model_without_evidence';
    }
  } else {
    onProgress(`Running sentiment analysis across ${evidence.length} evidence items`);
    rawResult = await analyzeComparisonSentiment({ companyA, companyB, evidence });
  }
  const results = formatComparisonResultForFrontend({ companyA, companyB, rawResult });
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
    leftOption: payload.leftOption || companyA,
    rightOption: payload.rightOption || companyB,
    results,
    rawResult,
    comments,
    evidence,
    sourceResults,
    timeline,
    meta: {
      sourcesUsed: evidence.length,
      generatedAt: new Date().toISOString(),
      commentCount: comments.length,
      sourceCount: sourceResults.length,
      analysisPollBudgetMs: env.analysisPollBudgetMs,
      analysisPollIntervalMs: env.analysisPollIntervalMs,
      analysisSourceTimeoutMs: env.analysisSourceTimeoutMs,
      analysisMaxSources: env.analysisMaxSources,
      analysisMaxSocialSources: env.analysisMaxSocialSources,
      tinyfishOnlyMode: env.tinyfishOnlyMode,
      fallbackMode,
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
