import { resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createYoga, YogaServerInstance } from 'graphql-yoga';
import pg from 'pg';
import type { GraphQLContext } from '../src/context.js';
import { schema } from '../src/schema.js';

const connectionString =
  process.env['PG_CONNECTION_STRING'] ??
  'postgres://postgres:postgres@localhost:5432/postgres?currentSchema=integrationTests';

async function resetDatabase(db: NodePgDatabase, schema: string) {
  // sql query for resetting the database
  const query = sql`
    DROP SCHEMA IF EXISTS ${sql.raw(schema)} CASCADE;
    CREATE SCHEMA ${sql.raw(schema)};
  `;
  await db.execute(query);
}

describe('hackernews example integration', () => {
  let yoga: YogaServerInstance<GraphQLContext, GraphQLContext>;
  let db: NodePgDatabase;
  let client: pg.Client;
  let currentSchema: string;
  beforeAll(async () => {
    const url = new URL(connectionString);
    const cs = url.searchParams.get('currentSchema');
    if (!cs) {
      throw new Error("Must provide 'currentSchema' in the connection string");
    }
    currentSchema = cs;
    client = new pg.Client(connectionString);
    await client.connect();
    db = drizzle(client);
    await resetDatabase(db, currentSchema);
    await migrate(drizzle(client), {
      migrationsSchema: currentSchema,
      migrationsFolder: resolve(__dirname, '../src/drizzle'),
    });
    yoga = createYoga({ schema, context: { db } });
  });

  afterAll(async () => {
    await resetDatabase(db, currentSchema);
    await client.end();
  });

  it('should create a new post', async () => {
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation createPost {
            postLink(
              url: "https://www.the-guild.dev/graphql/yoga-server"
              description: "Time to Relax with GraphQL Yoga"
            ) {
              url
              description
            }
          }
        `,
      }),
    });

    const body = await response.json();
    expect(body).toMatchInlineSnapshot(`
      {
        "data": {
          "postLink": {
            "description": "Time to Relax with GraphQL Yoga",
            "url": "https://www.the-guild.dev/graphql/yoga-server",
          },
        },
      }
    `);
  });
});
