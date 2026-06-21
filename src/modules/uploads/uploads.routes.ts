import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { workspaceAccess } from '../../middleware/workspaceAccess';
import { avatarUpload, attachmentUpload } from '../../config/multer';
import * as uploadsController from './uploads.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Avatar — user scoped, no workspace needed
router.post(
  '/avatar',
  avatarUpload.single('avatar'),  // field name must be 'avatar'
  uploadsController.uploadAvatar
);

// Attachments — workspace scoped
router.post(
  '/workspaces/:workspaceId/issues/:issueId/attachments',
  workspaceAccess(),
  attachmentUpload.array('files', 5),  // field name must be 'files', max 5
  uploadsController.uploadAttachments
);

router.get(
  '/workspaces/:workspaceId/issues/:issueId/attachments',
  workspaceAccess(),
  uploadsController.getAttachments
);

router.delete(
  '/workspaces/:workspaceId/attachments/:attachmentId',
  workspaceAccess(),
  uploadsController.deleteAttachment
);

export default router;