import express from 'express';
import cors from 'cors';
import comparisonsRoutes from './routes/comparisons.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import healthRoutes from './routes/health.routes.js';
import { runTinyfishAutomation } from './services/tinyfish.service.js';
import { analyzeComparisonSentiment } from './services/sentiment.service.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/comparisons', commentsRoutes);

// Legacy compatibility routes kept so the current frontend does not break mid-refactor.
app.post('/api/scrape', async (req, res, next) => {
  try {
    const { url, goal } = req.body;
    const response = await runTinyfishAutomation({ url, goal });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.post('/api/sentiment', async (req, res, next) => {
  try {
    const { text, companyA, companyB } = req.body;
    const response = await analyzeComparisonSentiment({
      companyA: { id: companyA, name: companyA },
      companyB: { id: companyB, name: companyB },
      evidence: [
        {
          sourceType: 'legacy',
          sourceLabel: 'legacy',
          title: 'Legacy text payload',
          summary: text,
          text,
        },
      ],
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error.message || 'Internal server error',
    details: error.details || null,
  });
});
