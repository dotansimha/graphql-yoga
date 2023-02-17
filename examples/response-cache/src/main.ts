import { createServer } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import {
  useResponseCache,
  UseResponseCacheParameter,
} from '@graphql-yoga/plugin-response-cache'

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      me: User
    }
    type User {
      id: ID!
      name: String!
    }
  `,
  resolvers: {
    Query: {
      me: () => {
        return {
          id: '1',
          name: 'Bob',
        }
      },
    },
  },
})

export const create = (
  config?: Omit<UseResponseCacheParameter, 'session'>,
  port?: number,
) => {
  const yoga = createYoga({
    schema,
    plugins: [
      useResponseCache({
        session: () => null,
        ...config,
      }),
    ],
    logging: port !== undefined,
  })

  const server = createServer(yoga)

  return new Promise<[number, () => Promise<void>]>((resolve) => {
    server.listen(port, () => {
      resolve([
        (server.address() as any).port as number,
        () =>
          new Promise<void>((resolve) => {
            server.close(() => {
              resolve()
            })
          }),
      ])
    })
  })
}

if (require.main === module) {
  create(undefined, 4000)
  console.log(`Server is running on http://localhost:4000`)
}
