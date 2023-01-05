import { createYoga, createSchema } from 'graphql-yoga'
import { useCSRFPrevention } from '../src/index.js'

describe('csrf-prevention', () => {
  const schema = createSchema({
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
  })

  const yoga = createYoga({
    schema,
    plugins: [useCSRFPrevention()],
    maskedErrors: false,
  })

  it('should not allow requests without the necessary header', async () => {
    const res = await yoga.fetch('http://yoga/graphql?query={hello}', {
      'x-not-the-required': 'header',
    })

    expect(res.status).toBe(403)
    expect(res.statusText).toMatchInlineSnapshot(`"Forbidden"`)
  })
})
