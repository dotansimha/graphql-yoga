import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const links = pgTable('links', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  description: varchar('description').notNull(),
  url: varchar('url').notNull(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  body: varchar('body').notNull(),
  linkId: uuid('link_id')
    .notNull()
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
});
