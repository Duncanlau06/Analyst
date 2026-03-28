import { Router } from 'express';
import { smokeTestSource } from '../config/sources.js';
import { runTinyfishAutomation } from '../services/tinyfish.service.js';
import { normalizeTinyfishResult } from '../services/normalization.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/tinyfish-smoke-test', async (req, res, next) => {
  const startedAt = Date.now();

  try {
    logger.info('TinyFish smoke test started', { url: smokeTestSource.url });
    const runResult = await runTinyfishAutomation({
      url: smokeTestSource.url,
      goal: smokeTestSource.goal,
    });

    const normalized = normalizeTinyfishResult(runResult, {
      ...smokeTestSource,
      sourceType: 'smoke-test',
    });

    const response = {
      ok: true,
      label: smokeTestSource.label,
      durationMs: Date.now() - startedAt,
      itemCount: normalized.length,
      items: normalized,
      raw: runResult,
    };

    logger.info('TinyFish smoke test completed', {
      durationMs: response.durationMs,
      itemCount: response.itemCount,
    });
    res.json(response);
  } catch (error) {
    logger.warn('TinyFish smoke test failed', { message: error.message });
    next(error);
  }
});

export default router;
