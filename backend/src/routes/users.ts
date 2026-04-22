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

router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/unfollow', authenticate, unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/mutual', authenticate, getMutualFollowing);

export default router;
