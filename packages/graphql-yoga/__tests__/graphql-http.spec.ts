import { createSchema, createYoga } from 'graphql-yoga'
import { serverAudits } from 'graphql-http'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        _: String
      }
    `,
  }),
})

for (const audit of serverAudits({
  url: 'http://yoga/graphql',
  fetchFn: yoga.fetch,
})) {
  test(audit.name, async () => {
    const result = await audit.fn()
    if (result.status !== 'ok') {
      throw result.reason
    }
  })
}
