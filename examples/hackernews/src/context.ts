import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type GraphQLContext = {
  db: NodePgDatabase;
};
