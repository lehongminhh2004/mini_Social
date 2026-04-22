import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  followUser,
  getFollowers,
  getFollowing,
  getMutualFollowing,
  unfollowUser,
} from '../controllers/users';

const router = Router();

router.use(authenticate);

router.post('/:id/follow', followUser);
router.delete('/:id/unfollow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/mutual', getMutualFollowing);

export default router;
