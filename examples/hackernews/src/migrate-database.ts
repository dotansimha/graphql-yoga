import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import type pg from 'pg';

// get current directory in esm
const __dirname = new URL('.', import.meta.url).pathname;

export async function migrateDatabase(client: pg.Client) {
  await migrate(drizzle(client), { migrationsFolder: resolve(__dirname, 'drizzle') });
}
