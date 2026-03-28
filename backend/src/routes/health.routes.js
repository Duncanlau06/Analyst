import { Router } from 'express';
import { hasOpenAI, hasTinyfish } from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    services: {
      tinyfish: hasTinyfish,
      openai: hasOpenAI,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
