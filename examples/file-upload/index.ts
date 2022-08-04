import { createYoga, createSchema } from 'graphql-yoga'
import http from 'http'
import fs from 'fs'
import path from 'path'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      scalar File
      type Query {
        hello(name: String): String!
      }
      type Mutation {
        readTextFile(file: File!): String!
        saveFile(file: File!): Boolean!
      }
    `,
    resolvers: {
      Query: {
        hello: (_, { name }: { name: string }) => `Hello ${name || 'World'}`,
      },
      Mutation: {
        readTextFile: async (_, { file }: { file: File }) => {
          const fileContent = await file.text()
          return fileContent
        },
        saveFile: async (_, { file }: { file: File }) => {
          try {
            const fileStream = file.stream()
            await fs.promises.writeFile(
              path.join(__dirname, file.name),
              fileStream,
            )
          } catch (e) {
            return false
          }
          return true
        },
      },
    },
  }),
  graphiql: {
    title: 'Hello World',
  },
})

const server = http.createServer(yoga)
server.listen(4000)
