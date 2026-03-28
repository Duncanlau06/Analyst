import { env, hasTinyfish } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

async function tinyfishRequest(body) {
  if (!hasTinyfish) {
    throw new AppError('TINYFISH_API_KEY not configured', 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.tinyfishTimeoutMs);

  try {
    logger.info('TinyFish request started', { url: body.url, timeoutMs: env.tinyfishTimeoutMs });

    const response = await fetch(`${env.tinyfishBaseUrl}/automation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.tinyfishApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`TinyFish error: ${response.status} ${errorBody}`, 502);
    }

    const result = await response.json();
    logger.info('TinyFish request completed', { url: body.url });
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('TinyFish request timed out', { url: body.url, timeoutMs: env.tinyfishTimeoutMs });
      throw new AppError(`TinyFish request timed out after ${env.tinyfishTimeoutMs}ms`, 504);
    }

    logger.error('TinyFish request failed', { url: body.url, message: error.message });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runTinyfishAutomation({ url, goal }) {
  return tinyfishRequest({ url, goal });
}
