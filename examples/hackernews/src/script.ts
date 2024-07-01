// 1
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import pg from 'pg';
import { links } from './drizzle/schema.js';

// 2
const client = new pg.Client(process.env['PG_CONNECTION_STRING']);

async function main() {
  // 3
  await client.connect();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle' });

  // 4
  await db.insert(links).values({
    description: 'Fullstack tutorial for GraphQL',
    url: 'www.howtographql.com',
  });

  const allLinks = await db.select().from(links);
  console.log(allLinks);
}

// 5
main()
  // 6
  .finally(async () => {
    await client.end();
  });
