import type { Response } from 'express';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';
import { isMutualFollow } from '../helpers/follow';

const MESSAGE_CONTENT_LIMIT = 2000;

const normalizeMessageContent = (content: unknown): string | null => {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > MESSAGE_CONTENT_LIMIT) return null;
  return trimmed;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const getConversationUserPair = (userId: string, otherUserId: string) => {
  return userId < otherUserId
    ? { user1Id: userId, user2Id: otherUserId }
    : { user1Id: otherUserId, user2Id: userId };
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user1: { select: { id: true, name: true, avatar: true } },
        user2: { select: { id: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    const items = conversations.map(conversation => {
      const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        otherUser,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      };
    });

    return res.json({ items, total: items.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversationMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const conversationId = normalizeOptionalString(req.params.id);
    if (!conversationId) return res.status(400).json({ error: 'Conversation id is required' });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, user1Id: true, user2Id: true },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ error: 'Forbidden: conversation does not belong to current user' });
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return res.json({ conversationId, items: messages, total: messages.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.userId;
    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });

    const receiverId = normalizeOptionalString(req.body.receiverId);
    const content = normalizeMessageContent(req.body.content);
    const image = normalizeOptionalString(req.body.image);

    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
    if (receiverId === senderId) return res.status(400).json({ error: 'Cannot message yourself' });
    if (!content) {
      return res.status(400).json({
        error: `Content is required and must be <= ${MESSAGE_CONTENT_LIMIT} characters`,
      });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const canMessage = await isMutualFollow(prisma, senderId, receiverId);
    if (!canMessage) {
      return res.status(403).json({
        error: 'Direct messages are only allowed between mutual followers',
      });
    }

    const pair = getConversationUserPair(senderId, receiverId);

    const conversation = await prisma.conversation.upsert({
      where: { user1Id_user2Id: pair },
      create: {
        ...pair,
        lastMessageAt: new Date(),
      },
      update: {
        lastMessageAt: new Date(),
      },
      select: { id: true },
    });

    const message = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
        image,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'DM',
        referenceId: message.id,
      },
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const messageId = normalizeOptionalString(req.params.id);
    if (!messageId) return res.status(400).json({ error: 'Message id is required' });

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        conversationId: true,
      },
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Forbidden: only sender can delete message' });
    }

    await prisma.directMessage.delete({ where: { id: messageId } });

    const latestMessage = await prisma.directMessage.findFirst({
      where: { conversationId: message.conversationId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { lastMessageAt: latestMessage?.createdAt ?? null },
    });

    return res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const messageId = normalizeOptionalString(req.params.id);
    if (!messageId) return res.status(400).json({ error: 'Message id is required' });

    const content = normalizeMessageContent(req.body.content);
    if (!content) {
      return res.status(400).json({
        error: `Content is required and must be <= ${MESSAGE_CONTENT_LIMIT} characters`,
      });
    }

    const existing = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true },
    });

    if (!existing) return res.status(404).json({ error: 'Message not found' });
    if (existing.senderId !== userId) {
      return res.status(403).json({ error: 'Forbidden: only sender can edit message' });
    }

    const updated = await prisma.directMessage.update({
      where: { id: messageId },
      data: { content },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return res.json({ message: 'Message edited successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to edit message' });
  }
};
