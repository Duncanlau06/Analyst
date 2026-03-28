import { sourceCatalog } from '../../config/sources.js';
import { normalizeTinyfishResult } from '../normalization.service.js';
import { runTinyfishAutomation } from '../tinyfish.service.js';
import { logger } from '../../utils/logger.js';

function platformMatches(platformFilter, source) {
  if (!platformFilter || platformFilter.length === 0) {
    return true;
  }

  return platformFilter.includes(source.platform);
}

async function runSocialSource({ source, query, companyA, companyB, onProgress }) {
  onProgress(`Scraping ${source.label} discussions for ${query}`);
  const startedAt = Date.now();

  try {
    const runResult = await runTinyfishAutomation({
      url: source.buildUrl ? source.buildUrl(query, companyA.name, companyB.name) : `${source.url}${encodeURIComponent(query)}`,
      goal: source.goal(query, companyA.name, companyB.name),
    });

    const normalizedItems = normalizeTinyfishResult(runResult, {
      ...source,
      sourceType: 'social',
    });

    onProgress(`Collected ${normalizedItems.length} ${source.label} discussion items`);
    return {
      evidence: normalizedItems,
      sourceResult: {
        sourceId: source.id,
        label: source.label,
        platform: source.platform,
        sourceType: 'social',
        status: 'success',
        itemCount: normalizedItems.length,
        durationMs: Date.now() - startedAt,
      },
    };
  } catch (error) {
    logger.warn('Social source skipped', { source: source.id, message: error.message });
    onProgress(`Skipping ${source.label}: ${error.message}`);
    return {
      evidence: [],
      sourceResult: {
        sourceId: source.id,
        label: source.label,
        platform: source.platform,
        sourceType: 'social',
        status: error.statusCode === 504 ? 'timeout' : 'failed',
        itemCount: 0,
        durationMs: Date.now() - startedAt,
        error: error.message,
      },
    };
  }
}

export async function fetchSocialComments({ query, companyA, companyB, platforms = [], onProgress = () => {} }) {
  const socialSources = sourceCatalog.social.filter((source) => platformMatches(platforms, source));
  const settledResults = await Promise.all(
    socialSources.map((source) => runSocialSource({ source, query, companyA, companyB, onProgress })),
  );

  return {
    evidence: settledResults.flatMap((result) => result.evidence),
    sourceResults: settledResults.map((result) => result.sourceResult),
  };
}
