import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './testApp';
import { setupTestDb, cleanDb, closeTestDb } from './setup';
import { createTestUser } from './helpers';

// Mock email queue so tests don't try to connect to Redis
vi.mock('../queues/email.queue', () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue(undefined),
  },
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

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await cleanDb();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'new@devflow.com',
        username: 'newuser',
        password: 'Test1234',
        fullName: 'New User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new@devflow.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // password hash must never be in response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'dupe@devflow.com', username: 'dupeuser' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dupe@devflow.com',
        username: 'newusername',
        password: 'Test1234',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already in use');
  });

  it('should reject duplicate username', async () => {
    await createTestUser({ email: 'first@devflow.com', username: 'takenuser' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'second@devflow.com',
        username: 'takenuser',
        password: 'Test1234',
      });

    expect(res.status).toBe(409);
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@devflow.com',
        username: 'testuser',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        username: 'testuser',
        password: 'Test1234',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login with correct credentials', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@devflow.com',
        password: 'Test1234',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject wrong password', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@devflow.com',
        password: 'WrongPass1',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@devflow.com',
        password: 'Test1234',
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return current user with valid token', async () => {
    // Register to get a token
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'me@devflow.com',
        username: 'meuser',
        password: 'Test1234',
      });

    const { accessToken } = res1.body.data;

    const res2 = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.email).toBe('me@devflow.com');
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});