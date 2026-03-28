import { analyzeComparison } from '../services/comparison-orchestrator.service.js';
import { asyncHandler, AppError } from '../utils/errors.js';

function validateComparisonBody(body) {
  const { companyA, companyB, query } = body;

  if (!query || !companyA?.id || !companyA?.name || !companyB?.id || !companyB?.name) {
    throw new AppError('query, companyA, and companyB are required', 400);
  }
}

export const analyzeComparisonController = asyncHandler(async (req, res) => {
  validateComparisonBody(req.body);
  const response = await analyzeComparison(req.body);
  res.json(response);
});
