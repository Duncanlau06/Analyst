import express from 'express';
import cors from 'cors';
import comparisonsRoutes from './routes/comparisons.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import debugRoutes from './routes/debug.routes.js';
import healthRoutes from './routes/health.routes.js';
import { runTinyfishAutomation } from './services/tinyfish.service.js';
import { analyzeComparisonSentiment } from './services/sentiment.service.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/comparisons', commentsRoutes);

// Provide basic auto-complete suggestions
app.post('/api/suggest', (req, res) => {
  const query = (req.body.query || '').toLowerCase();
  if (!query) return res.json([]);
  
  const options = [
    'Tesla Model Y', 'Tesla Model 3', 'Ford Mustang Mach-E', 'Hyundai Ioniq 5',
    'Kia EV6', 'Volkswagen ID.4', 'Chevrolet Bolt EV', 'Rivian R1T', 'BYD Seal',
    'MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 14', 'Surface Laptop 5',
    'Dell XPS 13', 'Lenovo ThinkPad X1', 'iPad Pro', 'Galaxy Tab S9',
    'iPhone 15', 'iPhone 15 Pro', 'Galaxy S24', 'Pixel 8 Pro', 'Xiaomi 14'
  ];
  
  const matches = options.filter(o => o.toLowerCase().includes(query));
  res.json(matches.slice(0, 6));
});

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
