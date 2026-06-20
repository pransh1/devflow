import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { workspaceAccess } from '../../middleware/workspaceAccess';
import * as workspaceController from './workspace.controller';

const router = Router();

// All workspace routes require auth
router.use(authenticate);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getMyWorkspaces);
router.get('/:slug', workspaceController.getWorkspaceBySlug);  // by slug, not id

// Member management — scoped to workspaceId
router.post('/:workspaceId/members', workspaceController.inviteMember);
router.get('/:workspaceId/members', workspaceController.getMembers);
router.delete(
  '/:workspaceId/members/:userId',
  workspaceAccess('admin'),   // only owner/admin can remove
  workspaceController.removeMember
);

export default router;