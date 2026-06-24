// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
// import { config } from "../config/env";
// import * as schema from "./schema";

// const pool = new Pool({
//   connectionString: config.db.url,
// });

// export const db = drizzle(pool, { schema });

// export async function checkDbConnection() : Promise<void> {
//   const client = await pool.connect();
//   client.release();
//   console.log('✅ Database connected');
// };

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export function getDb() {
  if (!_db) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

// Keep backward compat — lazy proxy
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export async function checkDbConnection(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  client.release();
  await pool.end();
  console.log('✅ Database connected');
}