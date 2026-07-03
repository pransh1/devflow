import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { workspaceAccess } from '../../middleware/workspaceAccess';
import * as chatController from './chat.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(workspaceAccess());

// Channels
router.post('/channels', chatController.createChannel);
router.get('/channels', chatController.getChannels);
router.get('/channels/:channelId', chatController.getChannelById);
router.post('/channels/:channelId/join', chatController.joinChannel);
router.delete('/channels/:channelId', chatController.deleteChannel);

// Messages
router.post('/channels/:channelId/messages', chatController.sendMessage);
router.get('/channels/:channelId/messages', chatController.getMessages);
router.patch('/channels/:channelId/messages/:messageId', chatController.editMessage);
router.delete('/channels/:channelId/messages/:messageId', chatController.deleteMessage);

// Threads
router.get(
  '/channels/:channelId/messages/:messageId/replies',
  chatController.getThreadReplies
);

export default router;