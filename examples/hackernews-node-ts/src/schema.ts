import { makeExecutableSchema } from '@graphql-tools/schema'
import type { Link, Prisma, User } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { GraphQLYogaError } from '@graphql-yoga/node'
import type { GraphQLContext } from './context'
import { APP_SECRET } from './auth'

export const typeDefinitions = /* GraphQL */ `
  type Link {
    id: ID!
    description: String!
    url: String!
    postedBy: User
    votes: [Vote!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    links: [Link!]!
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Vote {
    id: ID!
    link: Link!
    user: User!
  }

  type Query {
    info: String!
    feed(filter: String): [Link!]!
    me: User!
  }

  type Mutation {
    post(url: String!, description: String!): Link!
    signup(email: String!, password: String!, name: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    vote(linkId: ID!): Vote
  }

  type Subscription {
    newLink: Link!
    newVote: Vote!
  }

  input LinkOrderByInput {
    description: Sort
    url: Sort
    createdAt: Sort
  }

  enum Sort {
    asc
    desc
  }
`

export const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (
      parent: unknown,
      args: {
        filter?: string
        skip?: number
        take?: number
        orderBy?: {
          description?: Prisma.SortOrder
          url?: Prisma.SortOrder
          createdAt?: Prisma.SortOrder
        }
      },
      context: GraphQLContext,
    ) => {
      const where = args.filter
        ? {
            OR: [
              { description: { contains: args.filter } },
              { url: { contains: args.filter } },
            ],
          }
        : {}

      return context.prisma.link.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: args.orderBy,
      })
    },
    me: (parent: unknown, args: {}, context: GraphQLContext) => {
      if (context.currentUser === null) {
        throw new GraphQLYogaError('Unauthenticated!')
      }

      return context.currentUser
    },
  },
  User: {
    links: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).links(),
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    postedBy: async (parent: Link, args: {}, context: GraphQLContext) => {
      if (!parent.postedById) {
        return null
      }

      return context.prisma.link
        .findUnique({ where: { id: parent.id } })
        .postedBy()
    },
    votes: (parent: Link, args: {}, context: GraphQLContext) =>
      context.prisma.link.findUnique({ where: { id: parent.id } }).votes(),
  },
  Vote: {
    link: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).link(),
    user: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).user(),
  },
  Mutation: {
    post: async (
      parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext,
    ) => {
      if (context.currentUser === null) {
        throw new GraphQLYogaError('Unauthenticated!')
      }

      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
          postedBy: { connect: { id: context.currentUser.id } },
        },
      })

      context.pubSub.publish('newLink', { newLink })

      return newLink
    },
    signup: async (
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext,
    ) => {
      // 1
      const password = await hash(args.password, 10)

      const user = await context.prisma.user.create({
        data: { ...args, password },
      })

      const token = sign({ userId: user.id }, APP_SECRET)

      return {
        token,
        user,
      }
    },
    login: async (
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext,
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      })
      if (!user) {
        throw new GraphQLYogaError('No such user found')
      }

      const valid = await compare(args.password, user.password)
      if (!valid) {
        throw new GraphQLYogaError('Invalid password')
      }

      const token = sign({ userId: user.id }, APP_SECRET)

      return {
        token,
        user,
      }
    },
    vote: async (
      parent: unknown,
      args: { linkId: string },
      context: GraphQLContext,
    ) => {
      if (!context.currentUser) {
        throw new GraphQLYogaError('You must login in order to use upvote!')
      }

      const userId = context.currentUser.id
      const vote = await context.prisma.vote.findUnique({
        where: {
          linkId_userId: {
            linkId: Number(args.linkId),
            userId: userId,
          },
        },
      })

      if (vote !== null) {
        throw new GraphQLYogaError(`Already voted for link: ${args.linkId}`)
      }

      const newVote = await context.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          link: { connect: { id: Number(args.linkId) } },
        },
      })

      context.pubSub.publish('newVote', { newVote })

      return newVote
    },
  },
  Subscription: {
    newLink: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.subscribe('newLink')
      },
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
