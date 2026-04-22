import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  deleteMessage,
  editMessage,
  getConversationMessages,
  getConversations,
  sendMessage,
} from '../controllers/messages';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.post('/', sendMessage);
router.delete('/:id', deleteMessage);
router.put('/:id', editMessage);

export default router;
