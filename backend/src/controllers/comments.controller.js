import { asyncHandler, AppError } from '../utils/errors.js';
import { refreshComments } from '../services/comparison-orchestrator.service.js';

export const getCommentsController = asyncHandler(async (req, res) => {
  const { comparisonId } = req.params;
  const platforms = req.query.platforms
    ? String(req.query.platforms)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const response = await refreshComments({ comparisonId, platforms });
  if (!response) {
    throw new AppError('Comparison not found', 404);
  }

  res.json({
    comparisonId,
    comments: response.comments,
    latestCommentRefreshAt: response.latestCommentRefreshAt,
    sourceResults: response.commentSourceResults || [],
  });
});
