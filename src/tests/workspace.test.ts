import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './testApp';
import { setupTestDb, cleanDb, closeTestDb } from './setup';
import { createTestUser, createTestWorkspace } from './helpers';

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

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await cleanDb();

  // Create a user and get token for each test
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: 'owner@devflow.com',
      username: 'owneruser',
      password: 'Test1234',
      fullName: 'Owner User',
    });

  token = res.body.data.accessToken;
  userId = res.body.data.user.id;
});

describe('POST /api/v1/workspaces', () => {
  it('should create a workspace and add creator as owner', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Team',
        slug: 'my-team',
        description: 'Test workspace',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('my-team');
    expect(res.body.data.ownerId).toBe(userId);
  });

  it('should reject duplicate slug', async () => {
    await createTestWorkspace(userId, { slug: 'taken-slug' });

    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another', slug: 'taken-slug' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Slug already taken');
  });

  it('should reject invalid slug format', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Team', slug: 'Invalid Slug!' });

    expect(res.status).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .send({ name: 'My Team', slug: 'my-team' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/workspaces', () => {
  it('should return workspaces the user is a member of', async () => {
    await createTestWorkspace(userId, { slug: 'ws-1' });
    await createTestWorkspace(userId, { slug: 'ws-2' });

    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should return empty array if user has no workspaces', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('POST /api/v1/workspaces/:workspaceId/members', () => {
  it('should invite a member to workspace', async () => {
    const workspace = await createTestWorkspace(userId, { slug: 'invite-ws' });

    // Create second user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'member@devflow.com',
        username: 'memberuser',
        password: 'Test1234',
      });

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'member@devflow.com', role: 'member' });

    expect(res.status).toBe(201);
  });

  it('should reject invite for non-existent user', async () => {
    const workspace = await createTestWorkspace(userId, { slug: 'invite-ws-2' });

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspace.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nobody@devflow.com', role: 'member' });

    expect(res.status).toBe(404);
  });
});