import { createServer } from 'node:http';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createYoga } from 'graphql-yoga';
import pg from 'pg';
import { schema } from './schema.js';

async function main() {
  const client = new pg.Client(process.env['PG_CONNECTION_STRING']);
  await client.connect();
  await migrate(drizzle(client), { migrationsFolder: './src/drizzle' });
  const db = drizzle(client);
  const yoga = createYoga({ schema, context: { db } });
  const server = createServer(yoga);
  server.listen(4000, () => {
    console.info(`Server is running on http://localhost:4000${yoga.graphqlEndpoint}`);
  });
}

main();
