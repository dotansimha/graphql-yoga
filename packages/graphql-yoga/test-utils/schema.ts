import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLScalarType,
} from 'graphql'

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
        type: GraphQLString,
        description: 'Upload a single file',
        args: {
          file: {
            description: 'File to upload',
            type: new GraphQLScalarType({
              name: 'Upload',
            }),
          },
        },
        resolve: async (_, { file }: { file: File }) => {
          const content = await file.text()
          return content
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
