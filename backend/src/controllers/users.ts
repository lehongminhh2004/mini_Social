import type { Response } from 'express';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';
import { basicUserFields, isMutualFollow } from '../helpers/follow';

const formatUsersPayload = <T>(users: T[]) => ({
  count: users.length,
  users,
});

const getRouteId = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0];
  return null;
};

const ensureUserExists = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  return user;
};

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    const followingId = getRouteId(req.params.id);

    if (!followerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!followingId) return res.status(400).json({ error: 'User id is required' });
    if (followerId === followingId) return res.status(400).json({ error: 'Cannot follow yourself' });

    const target = await ensureUserExists(followingId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return res.status(200).json({ message: 'Already following', isFollowing: true });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return res.status(201).json({ message: 'Followed successfully', isFollowing: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user?.userId;
    const followingId = getRouteId(req.params.id);

    if (!followerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!followingId) return res.status(400).json({ error: 'User id is required' });
    if (followerId === followingId) return res.status(400).json({ error: 'Cannot unfollow yourself' });

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(200).json({ message: 'Already unfollowed', isFollowing: false });
    }

    await prisma.follow.delete({ where: { id: existing.id } });

    return res.status(200).json({ message: 'Unfollowed successfully', isFollowing: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getRouteId(req.params.id);
    if (!userId) return res.status(400).json({ error: 'User id is required' });

    const user = await ensureUserExists(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        follower: {
          select: basicUserFields,
        },
      },
    });

    return res.json(formatUsersPayload(followers.map(item => item.follower)));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getRouteId(req.params.id);
    if (!userId) return res.status(400).json({ error: 'User id is required' });

    const user = await ensureUserExists(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        following: {
          select: basicUserFields,
        },
      },
    });

    return res.json(formatUsersPayload(following.map(item => item.following)));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch following users' });
  }
};

export const getMutualFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = getRouteId(req.params.id);

    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });
    if (!targetUserId) return res.status(400).json({ error: 'User id is required' });
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot check mutual follow with yourself' });
    }

    const user = await ensureUserExists(targetUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [isFollowing, isFollowedBy, isMutual] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
        select: { id: true },
      }),
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: currentUserId,
          },
        },
        select: { id: true },
      }),
      isMutualFollow(prisma, currentUserId, targetUserId),
    ]);

    return res.json({
      userId: targetUserId,
      isFollowing: Boolean(isFollowing),
      isFollowedBy: Boolean(isFollowedBy),
      isMutual,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check mutual follow' });
  }
};
