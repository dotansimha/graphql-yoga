import { createYoga, createSchema } from 'graphql-yoga'
import { useInlineTrace } from '../src'

describe('Inline Trace', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
      `,
      resolvers: {
        Query: {
          hello() {
            return 'world'
          },
        },
      },
    }),
    plugins: [useInlineTrace()],
  })
})
