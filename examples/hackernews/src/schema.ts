import { createSchema } from 'graphql-yoga';
import { Prisma, type Link } from '@prisma/client';
import type { GraphQLContext } from './context';
import { GraphQLError } from 'graphql';

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
    link: Link
  }

  type Query {
    info: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
    comment(id: ID!): Comment
    link(id: ID!): Link
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`;

const parseIntSafe = (value: string): number | null => {
  if (/^(\d+)$/.test(value)) {
    return parseInt(value, 10);
  }
  return null;
};

const applySkipConstraints = (value: number) => {
  if (value < 0) {
    throw new GraphQLError(`'skip' argument value '${value}' is invalid, value must be positive.`);
  }
  return value;
};

const applyTakeConstraints = (params: { min: number; max: number; value: number }) => {
  if (params.value < params.min || params.value > params.max) {
    throw new GraphQLError(
      `'take' argument value '${params.value}' is outside the valid range of '${params.min}' to '${params.max}'.`,
    );
  }
  return params.value;
};

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (
      parent: unknown,
      args: { filterNeedle?: string; skip?: number; take?: number },
      context: GraphQLContext,
    ) => {
      const where = args.filterNeedle
        ? {
            OR: [
              { description: { contains: args.filterNeedle } },
              { url: { contains: args.filterNeedle } },
            ],
          }
        : {};

      const take = applyTakeConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
      });

      const skip = applySkipConstraints(args.skip ?? 0);

      return context.prisma.link.findMany({
        where,
        skip,
        take,
      });
    },
    comment: async (parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return context.prisma.comment.findUnique({
        where: { id: parseInt(args.id) },
      });
    },
    link: async (parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return context.prisma.link.findUnique({
        where: { id: parseInt(args.id) },
      });
    }
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, _: unknown, context: GraphQLContext) => {
      return context.prisma.comment.findMany({
        where: {
          linkId: parent.id,
        },
      });
    },
  },
  Mutation: {
    postLink: async (
      parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext,
    ) => {
      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
        },
      });
      return newLink;
    },
    postCommentOnLink: async (
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext,
    ) => {
      const linkId = parseIntSafe(args.linkId);
      if (linkId === null) {
        return Promise.reject(
          new GraphQLError(`Cannot post common on non-existing link with id '${args.linkId}'.`),
        );
      }

      if (!args.body || args.body.trim().length === 0) {
        return Promise.reject(new GraphQLError(`Comment body cannot be empty.`));
      }

      const newComment = await context.prisma.comment
        .create({
          data: {
            body: args.body,
            linkId,
          },
        })
        .catch((err: unknown) => {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            return Promise.reject(
              new GraphQLError(
                `Cannot post common on non-existing link with id '${args.linkId}'.`,
              ),
            );
          }
          return Promise.reject(err);
        });
        
      return newComment;
    },
  },
  Comment: {
    id: (parent: { id: number }) => parent.id,
    body: (parent: { body: string }) => parent.body,
    link: async (parent: { linkId: number }, _: unknown, context: GraphQLContext) => {
      if (!parent.linkId) {
        return null;
      }

      return context.prisma.link.findUnique({
        where: {
          id: parent.linkId,
        },
      });
    },
  }
};

export const schema = createSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
