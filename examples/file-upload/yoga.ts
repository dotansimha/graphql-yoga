import fs from 'fs'
import path from 'path'

import { createSchema, createYoga } from 'graphql-yoga'

export const yoga = createYoga({
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
            await fs.promises.writeFile(path.join(__dirname, file.name), fileStream)
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
