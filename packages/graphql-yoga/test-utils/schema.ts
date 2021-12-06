import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { GraphQLUpload } from 'graphql-yoga'

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
            type: GraphQLUpload,
          },
        },
        resolve: async (_, { image }, { logger }) => {
          const img = await image
          logger.debug(img)
          return !!img.filename
        },
      },
    }),
  }),
})
