import { Router } from 'express';
import { analyzeComparisonController } from '../controllers/comparisons.controller.js';

const router = Router();

router.post('/analyze', analyzeComparisonController);

export default router;
