import { eq, ilike, or } from 'drizzle-orm';
import { createGraphQLError, createSchema } from 'graphql-yoga';
import pg from 'pg';
import type { GraphQLContext } from './context.js';
import { comments, links } from './drizzle/schema.js';

function isUUIDV4(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
}

type Link = typeof links.$inferSelect;

const typeDefinitions = /* GraphQL */ `
  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    body: String!
  }

  type Query {
    hello: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`;

const applyTakeConstraints = (params: { min: number; max: number; value: number }) => {
  if (params.value < params.min || params.value > params.max) {
    throw createGraphQLError(
      `'take' argument value '${params.value}' is outside the valid range of '${params.min}' to '${params.max}'.`,
    );
  }
  return params.value;
};

const resolvers = {
  Query: {
    hello: () => `Hello World!`,
    feed: async (
      _parent: unknown,
      args: { filterNeedle?: string; skip?: number; take?: number },
      context: GraphQLContext,
    ) => {
      const take = applyTakeConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
      });

      return context.db
        .select()
        .from(links)
        .where(
          args.filterNeedle
            ? or(ilike(links.description, args.filterNeedle), ilike(links.url, args.filterNeedle))
            : undefined,
        )
        .limit(take);
    },
    comment: async (parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return context.db.select().from(comments).where(eq(comments.id, args.id));
    },
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, _: unknown, context: GraphQLContext) => {
      return context.db.select().from(comments).where(eq(comments.id, parent.id));
    },
  },
  Mutation: {
    postLink: async (
      _parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext,
    ) => {
      const newLink = await context.db
        .insert(links)
        .values({
          description: args.description,
          url: args.url,
        })
        .returning();

      return newLink[0];
    },
    postCommentOnLink: async (
      _parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext,
    ) => {
      if (isUUIDV4(args.linkId) === false) {
        return Promise.reject(
          createGraphQLError(`Cannot post common on non-existing link with id '${args.linkId}'.`),
        );
      }

      const comment = await context.db
        .insert(comments)
        .values({
          body: args.body,
          linkId: args.linkId,
        })
        .returning()
        .catch((err: unknown) => {
          if (
            err instanceof pg.DatabaseError &&
            err.constraint === 'comments_link_id_links_id_fk'
          ) {
            return Promise.reject(
              createGraphQLError(
                `Cannot post common on non-existing link with id '${args.linkId}'.`,
              ),
            );
          }
          return Promise.reject(err);
        });
      return comment[0];
    },
  },
};

export const schema = createSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
