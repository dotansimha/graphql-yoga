import { createServer } from '@graphql-yoga/node'

const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      scalar File
      type Query {
        hello(name: String): String!
      }
      type Mutation {
        readTextFile(file: File!): String!
      }
    `,
    resolvers: {
      Query: {
        hello: (_, { name }: { name: string }) => `Hello ${name || 'World'}`,
      },
      Mutation: {
        readFile: async (_, { file }: { file: File }) => {
          const fileContent = await file.text()
          return fileContent
        },
      },
    },
  },
  graphiql: {
    title: 'Hello World',
  },
})

server.start()
