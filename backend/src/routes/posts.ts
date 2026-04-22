import { Router } from 'express';
import { getPosts, createPost, addComment } from '../controllers/posts';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getPosts);
router.post('/', authenticate, createPost);
router.post('/:postId/comments', authenticate, addComment);

export default router;
