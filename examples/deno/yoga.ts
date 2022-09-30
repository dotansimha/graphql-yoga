import {
  createYoga,
  createSchema,
} from 'https://cdn.skypack.dev/graphql-yoga@three?dts'

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello Deno!',
      },
    },
  }),
})
