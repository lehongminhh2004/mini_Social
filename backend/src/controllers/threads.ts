import type { Response } from 'express';
import { ReactionType } from '@prisma/client';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';

const THREAD_CONTENT_LIMIT = 280;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const threadInclude = {
  author: { select: { id: true, name: true, avatar: true } },
};

const parsePagination = (pageQuery?: string, limitQuery?: string) => {
  const page = Math.max(Number.parseInt(pageQuery ?? `${DEFAULT_PAGE}`, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(limitQuery ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  return { page, limit, skip: (page - 1) * limit };
};

const normalizeContent = (content: unknown) => {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > THREAD_CONTENT_LIMIT) return null;
  return trimmed;
};

export const getTimelineThreads = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const authorIds = [userId, ...follows.map(follow => follow.followingId)];

    const threads = await prisma.thread.findMany({
      where: {
        replyToId: null,
        authorId: { in: authorIds },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ...threadInclude,
        _count: { select: { replies: true } },
      },
    });

    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline threads' });
  }
};

export const getExploreThreads = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page as string | undefined, req.query.limit as string | undefined);

    const [items, total] = await Promise.all([
      prisma.thread.findMany({
        where: { replyToId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ...threadInclude,
          _count: { select: { replies: true } },
        },
      }),
      prisma.thread.count({ where: { replyToId: null } }),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch explore threads' });
  }
};

export const getThreadById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        ...threadInclude,
        replyTo: { include: threadInclude },
      },
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const replies = await prisma.thread.findMany({
      where: { replyToId: id },
      orderBy: { createdAt: 'asc' },
      include: threadInclude,
    });

    res.json({ thread, replies });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

export const createThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const content = normalizeContent(req.body.content);
    if (!content) {
      return res.status(400).json({ error: `Content is required and must be <= ${THREAD_CONTENT_LIMIT} characters` });
    }

    const rawImage = req.body.image;
    const image = typeof rawImage === 'string' && rawImage.trim() ? rawImage.trim() : null;

    const thread = await prisma.thread.create({
      data: {
        content,
        image,
        authorId: userId,
      },
      include: threadInclude,
    });

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create thread' });
  }
};

export const deleteThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const existing = await prisma.thread.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) return res.status(404).json({ error: 'Thread not found' });
    if (existing.authorId !== userId) return res.status(403).json({ error: 'Forbidden: only author can delete this thread' });

    await prisma.thread.delete({ where: { id } });

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete thread' });
  }
};

export const replyToThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });
    const content = normalizeContent(req.body.content);

    if (!content) {
      return res.status(400).json({ error: `Content is required and must be <= ${THREAD_CONTENT_LIMIT} characters` });
    }

    const parent = await prisma.thread.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!parent) return res.status(404).json({ error: 'Parent thread not found' });

    const reply = await prisma.thread.create({
      data: {
        content,
        authorId: userId,
        replyToId: id,
      },
      include: threadInclude,
    });

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reply thread' });
  }
};

export const reactToThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const type = req.body.type as ReactionType;
    if (!Object.values(ReactionType).includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const thread = await prisma.thread.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const existingReaction = await prisma.reaction.findUnique({
      where: { threadId_userId: { threadId: id, userId } },
    });

    if (existingReaction) {
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { type },
      });

      return res.json({ message: 'Reaction updated', reaction: updatedReaction });
    }

    const reaction = await prisma.reaction.create({
      data: {
        type,
        threadId: id,
        userId,
      },
    });

    res.status(201).json({ message: 'Reaction added', reaction });
  } catch (error) {
    res.status(500).json({ error: 'Failed to react to thread' });
  }
};

export const removeThreadReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const existingReaction = await prisma.reaction.findUnique({
      where: { threadId_userId: { threadId: id, userId } },
      select: { id: true },
    });

    if (!existingReaction) {
      return res.status(404).json({ error: 'Reaction not found for this user on the thread' });
    }

    await prisma.reaction.delete({ where: { id: existingReaction.id } });

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

export const getThreadReactions = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const thread = await prisma.thread.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const reactions = await prisma.reaction.findMany({
      where: { threadId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = Object.values(ReactionType).reduce<Record<ReactionType, number>>((acc, reactionType) => {
      acc[reactionType] = 0;
      return acc;
    }, {} as Record<ReactionType, number>);

    for (const reaction of reactions) {
      summary[reaction.type] += 1;
    }

    res.json({
      items: reactions,
      summary,
      total: reactions.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thread reactions' });
  }
};

export const retweetThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const thread = await prisma.thread.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const existingRetweet = await prisma.retweet.findUnique({
      where: { threadId_userId: { threadId: id, userId } },
      select: { id: true },
    });

    if (existingRetweet) {
      return res.status(409).json({ error: 'You already retweeted this thread' });
    }

    const retweet = await prisma.retweet.create({
      data: {
        threadId: id,
        userId,
      },
    });

    res.status(201).json({ message: 'Retweeted successfully', retweet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retweet thread' });
  }
};

export const unretweetThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Invalid thread id' });

    const existingRetweet = await prisma.retweet.findUnique({
      where: { threadId_userId: { threadId: id, userId } },
      select: { id: true },
    });

    if (!existingRetweet) {
      return res.status(404).json({ error: 'Retweet not found for this user on the thread' });
    }

    await prisma.retweet.delete({
      where: { id: existingRetweet.id },
    });

    res.json({ message: 'Unretweeted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unretweet thread' });
  }
};
