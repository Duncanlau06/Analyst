import { env, hasTinyfish } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

function buildTinyfishHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': env.tinyfishApiKey,
  };
}

function buildAutomationBody(body) {
  return {
    url: body.url,
    goal: body.goal,
    browser_profile: body.browserProfile || 'lite',
  };
}

async function tinyfishRequest(path, options = {}) {
  if (!hasTinyfish) {
    throw new AppError('TINYFISH_API_KEY not configured', 500);
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(Number(options.timeoutMs)) ? Number(options.timeoutMs) : env.tinyfishTimeoutMs;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.info('TinyFish request started', { path, timeoutMs, meta: options.logMeta || null });

    const response = await fetch(`${env.tinyfishBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers: buildTinyfishHeaders(),
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`TinyFish error: ${response.status} ${errorBody}`, 502);
    }

    const result = await response.json();
    logger.info('TinyFish request completed', { path, meta: options.logMeta || null });
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('TinyFish request timed out', { path, timeoutMs, meta: options.logMeta || null });
      throw new AppError(`TinyFish request timed out after ${timeoutMs}ms`, 504);
    }

    logger.error('TinyFish request failed', { path, message: error.message, meta: options.logMeta || null });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runTinyfishAutomation({ url, goal, timeoutMs, browserProfile = 'lite' }) {
  return tinyfishRequest('/automation/run', {
    method: 'POST',
    body: buildAutomationBody({ url, goal, browserProfile }),
    timeoutMs,
    logMeta: { url },
  });
}

export async function startTinyfishAutomation({ url, goal, timeoutMs = 10000, browserProfile = 'lite' }) {
  return tinyfishRequest('/automation/run-async', {
    method: 'POST',
    body: buildAutomationBody({ url, goal, browserProfile }),
    timeoutMs,
    logMeta: { url },
  });
}

export async function getTinyfishRun({ runId, timeoutMs = 10000 }) {
  return tinyfishRequest(`/runs/${encodeURIComponent(runId)}`, {
    timeoutMs,
    logMeta: { runId },
  });
}

export async function getTinyfishRunsBatch({ runIds, timeoutMs = 10000 }) {
  return tinyfishRequest('/runs/batch', {
    method: 'POST',
    body: { run_ids: runIds },
    timeoutMs,
    logMeta: { runCount: runIds.length },
  });
}
