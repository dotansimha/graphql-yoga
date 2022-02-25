import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLYogaError } from '@graphql-yoga/node'
import type { Link } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import type { GraphQLContext } from './context'

export const typeDefinitions = /* GraphQL */ `
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
    info: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`

const parseIntSafe = (value: string): number | null => {
  if (/^(\d+)$/.test(value)) {
    return parseInt(value, 10)
  }
  return null
}

const applyTakeConstraints = (params: {
  min: number
  max: number
  value: number
}) => {
  if (params.value < params.min || params.value > params.max) {
    throw new GraphQLYogaError(
      `'take' argument value '${params.value}' is outside the valid range of '${params.min}' to '${params.max}'.`,
    )
  }
  return params.value
}

export const resolvers = {
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
        : {}

      const take = applyTakeConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
      })

      return context.prisma.link.findMany({
        where,
        skip: args.skip,
        take,
      })
    },
    comment: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      return context.prisma.comment.findUnique({
        where: { id: parseInt(args.id) },
      })
    },
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, args: {}, context: GraphQLContext) => {
      return context.prisma.comment.findMany({
        where: {
          linkId: parent.id,
        },
      })
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
      })
      return newLink
    },
    postCommentOnLink: async (
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext,
    ) => {
      const linkId = parseIntSafe(args.linkId)
      if (linkId === null) {
        return Promise.reject(
          new GraphQLYogaError(
            `Cannot post common on non-existing link with id '${args.linkId}'.`,
          ),
        )
      }

      const comment = await context.prisma.comment
        .create({
          data: {
            body: args.body,
            linkId,
          },
        })
        .catch((err: unknown) => {
          if (err instanceof PrismaClientKnownRequestError) {
            if (err.code === 'P2003') {
              return Promise.reject(
                new GraphQLYogaError(
                  `Cannot post common on non-existing link with id '${args.linkId}'.`,
                ),
              )
            }
          }
          return Promise.reject(err)
        })
      return comment
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
