import { Router } from 'express';
import {
  createThread,
  deleteThread,
  getExploreThreads,
  getThreadReactions,
  getThreadById,
  getTimelineThreads,
  reactToThread,
  removeThreadReaction,
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
router.post('/:id/react', reactToThread);
router.delete('/:id/react', removeThreadReaction);
router.get('/:id/reactions', getThreadReactions);

export default router;
