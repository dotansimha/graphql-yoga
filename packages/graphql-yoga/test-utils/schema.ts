import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLScalarType,
  GraphQLInt,
} from 'graphql'

let counter = 0

export function getCounterValue() {
  return counter
}

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
      counter: {
        type: GraphQLInt,
        subscribe: async function* () {
          while (true) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            yield counter++
          }
        },
        resolve: (counter) => counter,
      },
    }),
  }),
})
