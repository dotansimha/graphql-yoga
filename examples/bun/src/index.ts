import { createYoga, createSchema, Repeater } from 'graphql-yoga'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }

      type Subscription {
        time: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'Hello world!',
      },
      Subscription: {
        time: {
          subscribe: () =>
            new Repeater(async (push, end) => {
              const interval = setInterval(() => {
                push(new Date().toISOString())
              }, 1000)
              end.then(() => clearInterval(interval))
              await end
            }),
          resolve: (value) => value,
        },
      },
    },
  }),
})

const server = Bun.serve({
  fetch: yoga,
  port: 4000,
  hostname: '0.0.0.0',
  development: true,
})

console.info(
  `Server is running on ${new URL(yoga.graphqlEndpoint, server.hostname)}`,
)
