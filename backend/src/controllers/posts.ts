import type { Request, Response } from 'express';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
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

    // Format posts for the frontend
    const formattedPosts = posts.map(post => {
      const likes = post.reactions.filter(r => r.type === 'LIKE').length;
      const loves = post.reactions.filter(r => r.type === 'LOVE').length;

      return {
        id: post.id,
        author: post.author,
        content: post.content,
        createdAt: post.createdAt,
        likes,
        loves,
        comments: post.comments.map(c => ({
          id: c.id,
          author: c.author.name,
          content: c.content,
          createdAt: c.createdAt,
        })),
        reactions: post.reactions // keeping raw reactions if needed
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: true,
        reactions: true,
      }
    });

    res.status(201).json({
      id: post.id,
      author: post.author,
      content: post.content,
      createdAt: post.createdAt,
      likes: 0,
      loves: 0,
      comments: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: postId as string,
        authorId: userId,
      },
      include: {
        author: { select: { name: true } },
      }
    });

    res.status(201).json({
      id: comment.id,
      author: (comment as any).author.name,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const reactToPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { type } = req.body; // 'LIKE' or 'LOVE'
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_userId: { postId: postId as string, userId } },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off if clicking the same reaction
        await prisma.reaction.delete({ where: { id: existingReaction.id } });
        return res.json({ message: 'Reaction removed' });
      } else {
        // Change reaction type
        const updated = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return res.json({ message: 'Reaction updated', reaction: updated });
      }
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        type,
        postId: postId as string,
        userId,
      },
    });

    res.status(201).json({ message: 'Reaction added', reaction });
  } catch (error) {
    res.status(500).json({ error: 'Failed to react to post' });
  }
};
