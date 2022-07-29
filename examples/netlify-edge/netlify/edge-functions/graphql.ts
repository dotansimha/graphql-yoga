import { createYoga } from 'https://cdn.skypack.dev/graphql-yoga'
import { createSchema } from 'https://cdn.skypack.dev/graphql-yoga/schema'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
  }),
})

export default yoga
