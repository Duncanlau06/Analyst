import { analyzeComparison } from '../services/comparison-orchestrator.service.js';
import { asyncHandler, AppError } from '../utils/errors.js';

function toCompany(option) {
  if (!option?.id || !option?.name) {
    return null;
  }

  return {
    id: String(option.id),
    name: String(option.name),
    color: option.color || null,
  };
}

function normalizeComparisonBody(body) {
  const companyA = toCompany(body.companyA) || toCompany(body.leftOption);
  const companyB = toCompany(body.companyB) || toCompany(body.rightOption);

  return {
    ...body,
    companyA,
    companyB,
    leftOption: toCompany(body.leftOption) || companyA,
    rightOption: toCompany(body.rightOption) || companyB,
  };
}

function validateComparisonBody(body) {
  const { companyA, companyB, query } = body;

  if (!query || !companyA?.id || !companyA?.name || !companyB?.id || !companyB?.name) {
    throw new AppError('query, companyA, and companyB are required', 400);
  }
}

export const analyzeComparisonController = asyncHandler(async (req, res) => {
  const normalizedBody = normalizeComparisonBody(req.body);
  validateComparisonBody(normalizedBody);
  const response = await analyzeComparison(normalizedBody);
  res.json(response);
});
