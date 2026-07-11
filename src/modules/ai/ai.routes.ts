import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { workspaceAccess } from '../../middleware/workspaceAccess';
import * as aiController from './ai.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(workspaceAccess());

router.post('/chat', aiController.chat);
router.post('/search', aiController.semanticSearch);
router.post('/issues/:issueId/summarize', aiController.summarizeIssue);

export default router;