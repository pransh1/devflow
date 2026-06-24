import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../db/schema';
import {
  users, workspaces, workspaceMembers,
  projects, issues, issueComments, attachments
} from '../db/schema';

export async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_TEST ||
      'postgresql://localhost:5432/devflow_test',
  });
  const db = drizzle(pool, { schema });

  // Migrate first
  await migrate(db, { migrationsFolder: 'src/db/migrations' });

  // Clean slate before all tests start
  await db.delete(attachments);
  await db.delete(issueComments);
  await db.delete(issues);
  await db.delete(projects);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);
  await db.delete(users);

  await pool.end();
  console.log('✅ Test DB ready');
}

export async function teardown() {
  // nothing needed
}