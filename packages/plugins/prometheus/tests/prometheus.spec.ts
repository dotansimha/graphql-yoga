import { usePrometheus } from '@graphql-yoga/plugin-prometheus'
import { createSchema, createYoga } from 'graphql-yoga'
import { register as registry } from 'prom-client'

describe('Prometheus', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello world!',
      },
    },
  })
  afterEach(() => {
    registry.clear()
  })
  it('http flag should work', async () => {
    const yoga = createYoga({
      schema,
      plugins: [
        usePrometheus({
          http: true,
          registry,
        }),
      ],
    })
    const result = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query TestProm {
            hello
          }
        `,
      }),
    })
    await result.text()
    const metrics = await registry.metrics()
    expect(metrics).toContain('graphql_yoga_http_duration_bucket')
    expect(metrics).toContain('operationName="TestProm"')
    expect(metrics).toContain('operationType="query"')
    expect(metrics).toContain('url="http://localhost:4000/graphql"')
    expect(metrics).toContain('method="POST"')
    expect(metrics).toContain('statusCode="200"')
    expect(metrics).toContain('statusText="OK"')
  })
})
