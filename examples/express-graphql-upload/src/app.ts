import { createServer } from '@graphql-yoga/node'
import express from 'express'
import { graphqlUploadExpress, GraphQLUpload, FileUpload } from 'graphql-upload'

export function buildApp() {
  const app = express()

  const graphQLServer = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        scalar Upload
        type Query {
          hello: String
        }
        type Mutation {
          getFileName(upload: Upload!): String
        }
        type Subscription {
          countdown(from: Int!): Int!
        }
      `,
      resolvers: {
        Upload: GraphQLUpload,
        Query: {
          hello: () => 'world',
        },
        Mutation: {
          getFileName: async (
            root,
            { upload }: { upload: Promise<FileUpload> },
          ) => {
            const uploadObj = await upload
            return uploadObj.filename
          },
        },
        Subscription: {
          countdown: {
            subscribe: async function* (_, { from }) {
              for (let i = from; i >= 0; i--) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                yield { countdown: i }
              }
            },
          },
        },
      },
    },
    logging: false,
  })

  app.use(
    '/graphql',
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    graphQLServer.requestListener,
  )

  return app
}
