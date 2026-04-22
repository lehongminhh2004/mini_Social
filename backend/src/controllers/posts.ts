import type { Response } from 'express';
import { ReactionType } from '@prisma/client';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const threads = await prisma.thread.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
    });

    // Format threads for the frontend
    const formattedThreads = threads.map(thread => {
      const likes = thread.reactions.filter(r => r.type === ReactionType.LIKE).length;
      const loves = thread.reactions.filter(r => r.type === ReactionType.LOVE).length;

      return {
        id: thread.id,
        author: thread.author,
        content: thread.content,
        image: thread.image,
        replyToId: thread.replyToId,
        createdAt: thread.createdAt,
        likes,
        loves,
        comments: thread.comments.map(c => ({
          id: c.id,
          author: c.author.name,
          content: c.content,
          createdAt: c.createdAt,
        })),
        reactions: thread.reactions,
      };
    });

    res.json(formattedThreads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, image, replyToId } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const thread = await prisma.thread.create({
      data: {
        content,
        authorId: userId,
        image,
        replyToId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: true,
        reactions: true,
      },
    });

    res.status(201).json({
      id: thread.id,
      author: thread.author,
      content: thread.content,
      image: thread.image,
      replyToId: thread.replyToId,
      createdAt: thread.createdAt,
      likes: 0,
      loves: 0,
      comments: [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create thread' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const rawThreadId = req.params.threadId ?? req.params.postId;
    const threadId = Array.isArray(rawThreadId) ? rawThreadId[0] : rawThreadId;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!threadId) return res.status(400).json({ error: 'Thread ID is required' });

    const comment = await prisma.comment.create({
      data: {
        content,
        threadId,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    });

    res.status(201).json({
      id: comment.id,
      author: comment.author.name,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
