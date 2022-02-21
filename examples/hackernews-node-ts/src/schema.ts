import { makeExecutableSchema } from '@graphql-tools/schema'
import type { Link, User } from '@prisma/client'
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

  type Query {
    info: String!
    feed: [Link!]!
    me: User!
  }

  type Mutation {
    post(url: String!, description: String!): Link!
    signup(email: String!, password: String!, name: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
`

export const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent: unknown, args: {}, context: GraphQLContext) => {
      return context.prisma.link.findMany()
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
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
