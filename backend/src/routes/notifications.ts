import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getNotifications, markNotificationAsRead } from '../controllers/notifications';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/:id/read', markNotificationAsRead);

export default router;
