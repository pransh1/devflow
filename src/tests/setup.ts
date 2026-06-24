import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../db/schema';
import { users, workspaces, workspaceMembers, projects, issues, issueComments, attachments } from '../db/schema';

const TEST_DB_URL = process.env.DATABASE_URL_TEST ||
  'postgresql://localhost:5432/devflow_test';

const testPool = new Pool({ connectionString: TEST_DB_URL });

export const testDb = drizzle(testPool, { schema });

// Run migrations on test DB before all tests
export async function setupTestDb() {
  await migrate(testDb, { migrationsFolder: 'src/db/migrations' });
};

// Clean all tables between tests — order matters due to foreign keys
export async function cleanDb() {
  await testDb.delete(attachments);
  await testDb.delete(issueComments);
  await testDb.delete(issues);
  await testDb.delete(projects);
  await testDb.delete(workspaceMembers);
  await testDb.delete(workspaces);
  await testDb.delete(users);
};

export async function closeTestDb() {
  await testPool.end();
}