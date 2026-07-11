import { Router } from 'express';
import { internalAuth } from '../../middleware/internalAuth';
import * as internalController from './internal.controller';

const router = Router();

router.use(internalAuth);

router.get('/issues/:issueId', internalController.getIssueForAI);
router.get('/workspaces/:workspaceId/context', internalController.getWorkspaceContext);

export default router;