import { sourceCatalog } from '../../config/sources.js';
import { normalizeTinyfishResult } from '../normalization.service.js';
import { runTinyfishAutomation } from '../tinyfish.service.js';

function platformMatches(platformFilter, source) {
  if (!platformFilter || platformFilter.length === 0) {
    return true;
  }

  return platformFilter.includes(source.platform);
}

export async function fetchSocialComments({ query, companyA, companyB, platforms = [], onProgress = () => {} }) {
  const socialSources = sourceCatalog.social.filter((source) => platformMatches(platforms, source));
  const evidence = [];

  for (const source of socialSources) {
    onProgress(`Scraping ${source.label} discussions for ${query}`);
    try {
      const runResult = await runTinyfishAutomation({
        url: `${source.url}${encodeURIComponent(query)}`,
        goal: source.goal(query, companyA.name, companyB.name),
      });

      evidence.push(
        ...normalizeTinyfishResult(runResult, {
          ...source,
          sourceType: 'social',
        }),
      );
    } catch (error) {
      onProgress(`Skipping ${source.label}: ${error.message}`);
    }
  }

  return evidence;
}
