import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { GraphQLBlob } from '@graphql-yoga/core'

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      ping: {
        type: GraphQLString,
        resolve: () => 'pong',
      },
    }),
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      echo: {
        type: GraphQLString,
        args: {
          message: { type: GraphQLString },
        },
        resolve: (_, { message }) => message,
      },
      singleUpload: {
        type: GraphQLBoolean,
        description: 'Upload a single file',
        args: {
          image: {
            description: 'Image file to upload',
            type: GraphQLBlob,
          },
        },
        resolve: async (_, { image }: { image: File }, { logger }) => {
          logger.debug(image)
          return !!image.name
        },
      },
    }),
  }),
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
      ping: {
        type: GraphQLString,
        subscribe: async function* () {
          yield { ping: 'pong' }
        },
      },
    }),
  }),
})
