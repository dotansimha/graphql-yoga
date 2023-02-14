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
  it('http flag should work and do not send headers by default', async () => {
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
        'x-test': 'test',
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
    expect(metrics).not.toContain('requestHeaders')
    expect(metrics).not.toContain('x-test=test')
  })
  it('httpRequestHeaders should work', async () => {
    const yoga = createYoga({
      schema,
      plugins: [
        usePrometheus({
          http: true,
          httpRequestHeaders: true,
          registry,
        }),
      ],
    })
    const result = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test': 'test',
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
    expect(metrics).toContain(
      'requestHeaders="{\\"content-type\\":\\"application/json\\",\\"x-test\\":\\"test\\",\\"content-length\\":\\"82\\"}"}',
    )
  })
  it('httpResponseHeaders should work', async () => {
    const yoga = createYoga({
      schema,
      plugins: [
        usePrometheus({
          http: true,
          httpResponseHeaders: true,
          registry,
        }),
      ],
    })
    const result = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test': 'test',
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
    expect(metrics).toContain(
      `responseHeaders="{\\"content-type\\":\\"application/json; charset=utf-8\\",\\"content-length\\\":\\"33\\"}"}`,
    )
  })
  it('endpoint should work', async () => {
    const yoga = createYoga({
      schema,
      plugins: [
        usePrometheus({
          endpoint: '/metrics',
          http: true,
          execute: true,
          registry,
        }),
      ],
    })
    const graphqlResult = await yoga.fetch('http://localhost:4000/graphql', {
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
    await graphqlResult.text()
    const result = await yoga.fetch('http://localhost:4000/metrics')
    const metrics = await result.text()
    expect(metrics).toContain('graphql_envelop_phase_execute_bucket')
    expect(metrics).toContain('graphql_yoga_http_duration_bucket')
    expect(metrics).toContain('operationName="TestProm"')
    expect(metrics).toContain('operationType="query"')
    expect(metrics).toContain('url="http://localhost:4000/graphql"')
    expect(metrics).toContain('method="POST"')
    expect(metrics).toContain('statusCode="200"')
    expect(metrics).toContain('statusText="OK"')
  })
})
