import type { PrismaClient } from '@prisma/client';

const basicUserSelect = {
  id: true,
  name: true,
  avatar: true,
  bio: true,
} as const;

export const basicUserFields = basicUserSelect;

export const isMutualFollow = async (
  prisma: PrismaClient,
  userId: string,
  otherUserId: string,
): Promise<boolean> => {
  if (!userId || !otherUserId || userId === otherUserId) return false;

  const [aFollowsB, bFollowsA] = await Promise.all([
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: otherUserId,
        },
      },
      select: { id: true },
    }),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: otherUserId,
          followingId: userId,
        },
      },
      select: { id: true },
    }),
  ]);

  return Boolean(aFollowsB && bFollowsA);
};
