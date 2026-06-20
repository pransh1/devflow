import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { workspaceAccess } from '../../middleware/workspaceAccess';
import * as issuesController from './issues.controller';

const router = Router({ mergeParams: true }); // mergeParams lets us access :workspaceId from parent

router.use(authenticate);
router.use(workspaceAccess()); // every route requires workspace membership

// Projects
router.post('/projects', issuesController.createProject);
router.get('/projects', issuesController.getProjects);
router.get('/projects/:slug', issuesController.getProjectBySlug);

// Issues — nested under project
router.post('/projects/:projectId/issues', issuesController.createIssue);
router.get('/projects/:projectId/issues', issuesController.listIssues);
router.get('/issues/:issueId', issuesController.getIssue);
router.patch('/issues/:issueId', issuesController.updateIssue);
router.delete('/issues/:issueId', issuesController.deleteIssue);

// Comments — nested under issue
router.post('/issues/:issueId/comments', issuesController.addComment);
router.delete('/issues/:issueId/comments/:commentId', issuesController.deleteComment);

export default router;