import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './testApp';
import { setupTestDb, cleanDb, closeTestDb } from './setup';
import { createTestUser, createTestWorkspace, createTestProject, createTestIssue } from './helpers';

vi.mock('../queues/email.queue', () => ({
  emailQueue: { add: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../config/redis', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    connect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  },
}));

let token: string;
let userId: string;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await cleanDb();

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: 'owner@devflow.com',
      username: 'owneruser',
      password: 'Test1234',
    });

  token = res.body.data.accessToken;
  userId = res.body.data.user.id;

  const workspace = await createTestWorkspace(userId, { slug: 'test-ws' });
  workspaceId = workspace.id;

  const project = await createTestProject(workspaceId, userId);
  projectId = project.id;
});

describe('POST /api/v1/workspaces/:workspaceId/projects/:projectId/issues', () => {
  it('should create an issue successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Fix login bug',
        description: 'Users cannot log in',
        status: 'todo',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Fix login bug');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.createdById).toBe(userId);
  });

  it('should reject issue without title', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
  });

  it('should reject non-member from creating issue', async () => {
    // Register a second user who is NOT in the workspace
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'outsider@devflow.com',
        username: 'outsider',
        password: 'Test1234',
      });
    const outsiderToken = res2.body.data.accessToken;

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Should fail' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/workspaces/:workspaceId/issues/:issueId', () => {
  it('should update issue status', async () => {
    const issue = await createTestIssue(workspaceId, projectId, userId);

    const res = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  it('should reject invalid status value', async () => {
    const issue = await createTestIssue(workspaceId, projectId, userId);

    const res = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/workspaces/:workspaceId/issues/:issueId', () => {
  it('should delete an issue', async () => {
    const issue = await createTestIssue(workspaceId, projectId, userId);

    const res = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Issue deleted');
  });

  it('should return 404 for non-existent issue', async () => {
    const res = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/issues/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/workspaces/:workspaceId/projects/:projectId/issues', () => {
  it('should list issues with pagination', async () => {
    await createTestIssue(workspaceId, projectId, userId, { title: 'Issue 1' });
    await createTestIssue(workspaceId, projectId, userId, { title: 'Issue 2' });
    await createTestIssue(workspaceId, projectId, userId, { title: 'Issue 3' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(3);
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it('should filter issues by status', async () => {
    await createTestIssue(workspaceId, projectId, userId, { status: 'todo' });
    await createTestIssue(workspaceId, projectId, userId, { status: 'done' });
    await createTestIssue(workspaceId, projectId, userId, { status: 'done' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(2);
    expect(res.body.data.data.every((i: any) => i.status === 'done')).toBe(true);
  });
});