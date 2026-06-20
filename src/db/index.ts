import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config/env";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: config.db.url,
});

export const db = drizzle(pool, { schema });

export async function checkDbConnection() : Promise<void> {
  const client = await pool.connect();
  client.release();
  console.log('✅ Database connected');
};