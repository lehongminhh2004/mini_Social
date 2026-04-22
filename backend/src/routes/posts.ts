import { Router } from 'express';
import { getPosts, createPost, addComment, reactToPost } from '../controllers/posts';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getPosts);
router.post('/', authenticate, createPost);
router.post('/:postId/comments', authenticate, addComment);
router.post('/:postId/react', authenticate, reactToPost);

export default router;
