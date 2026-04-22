import type { Response } from 'express';
import prisma from '../prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const num = Number.parseInt(typeof value === 'string' ? value : '', 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
};

const getRouteId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return res.json({
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notificationId = getRouteId(req.params.id);
    if (!notificationId) return res.status(400).json({ error: 'Notification id is required' });

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true, read: true },
    });

    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: notification does not belong to current user' });
    }

    if (notification.read) {
      return res.json({ message: 'Notification already marked as read' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};
