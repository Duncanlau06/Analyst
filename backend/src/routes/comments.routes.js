import { Router } from 'express';
import { getCommentsController } from '../controllers/comments.controller.js';

const router = Router();

router.get('/:comparisonId/comments', getCommentsController);

export default router;
