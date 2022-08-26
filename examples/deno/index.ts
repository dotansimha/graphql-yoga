import { createYoga, createSchema } from 'npm:graphql-yoga'

const yoga = createYoga({
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

Deno.serve(
  async (req) => {
    const res = await yoga.handleRequest(req)
    return new Response(res.body, res)
  },
  {
    port: 4000,
  },
)
