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

const GraphQLFile = new GraphQLScalarType({
  name: 'File',
  description: 'A file',
})

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
        type: new GraphQLObjectType({
          name: 'FileInfo',
          fields: () => ({
            name: { type: GraphQLString },
            type: { type: GraphQLString },
            text: { type: GraphQLString },
          }),
        }),
        description: 'Upload a single file',
        args: {
          file: {
            description: 'File to upload',
            type: GraphQLFile,
          },
        },
        resolve: async (_, { file }: { file: File }) => file,
      },
      parseFileStream: {
        type: GraphQLString,
        description: 'Check if the file stream is valid',
        args: {
          file: {
            description: 'File to check',
            type: GraphQLFile,
          },
        },
        resolve: async (_, { file }: { file: File }) => {
          const chunks = []
          for await (const chunk of file.stream()) {
            chunks.push(Buffer.from(chunk))
          }
          return Buffer.concat(chunks).toString('utf8')
        },
      },
      parseArrayBuffer: {
        type: GraphQLString,
        description: 'Check if the array buffer is valid',
        args: {
          file: {
            description: 'File to check',
            type: GraphQLFile,
          },
        },
        resolve: async (_, { file }: { file: File }) => {
          return Buffer.from(await file.arrayBuffer()).toString('utf8')
        },
      },
    }),
  }),
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
      counter: {
        type: GraphQLInt,
        async *subscribe() {
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
