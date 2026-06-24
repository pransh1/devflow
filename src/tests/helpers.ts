import bcrypt from 'bcryptjs';
import { testDb } from './setup';
import { users, workspaces, workspaceMembers, projects, issues } from '../db/schema';

export async function createTestUser(overrides = {}) {
  const passwordHash = await bcrypt.hash('Test1234', 10);
  const [user] = await testDb
    .insert(users)
    .values({
      email: 'test@devflow.com',
      username: 'testuser',
      passwordHash,
      fullName: 'Test User',
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestWorkspace(ownerId: string, overrides = {}) {
  const result = await testDb.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: 'Test Workspace',
        slug: 'test-workspace',
        ownerId,
        ...overrides,
      })
      .returning();

    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: ownerId,
      role: 'owner',
    });

    return workspace;
  });
  return result;
}

export async function createTestProject(workspaceId: string, createdById: string, overrides = {}) {
  const [project] = await testDb
    .insert(projects)
    .values({
      workspaceId,
      name: 'Test Project',
      slug: 'test-project',
      createdById,
      ...overrides,
    })
    .returning();
  return project;
}

export async function createTestIssue(
  workspaceId: string,
  projectId: string,
  createdById: string,
  overrides = {}
) {
  const [issue] = await testDb
    .insert(issues)
    .values({
      workspaceId,
      projectId,
      title: 'Test Issue',
      createdById,
      ...overrides,
    })
    .returning();
  return issue;
}