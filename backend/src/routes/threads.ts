import { Router } from 'express';
import {
  createThread,
  deleteThread,
  getExploreThreads,
  getThreadById,
  getTimelineThreads,
  replyToThread,
} from '../controllers/threads';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getTimelineThreads);
router.get('/explore', getExploreThreads);
router.get('/:id', getThreadById);
router.post('/', createThread);
router.delete('/:id', deleteThread);
router.post('/:id/reply', replyToThread);

export default router;
