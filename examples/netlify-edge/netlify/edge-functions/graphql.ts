import { createYoga, createSchema } from 'https://cdn.skypack.dev/graphql-yoga'

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
