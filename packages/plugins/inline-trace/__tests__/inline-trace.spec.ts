import request from 'supertest'
import { createYoga, createSchema } from 'graphql-yoga'
import { useInlineTrace } from '../src'
import { Trace } from 'apollo-reporting-protobuf'
import { GraphQLError } from 'graphql'

describe('Inline Trace', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
          boom: String!
        }
      `,
      resolvers: {
        Query: {
          hello() {
            return 'world'
          },
          boom() {
            throw new Error('bam')
          },
        },
      },
    }),
    plugins: [useInlineTrace()],
  })

  it('should add ftv1 tracing to result extensions', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ hello }',
      })

    expect(response.ok).toBeTruthy()
    expect(response.body?.errors).toBeUndefined()
    expect(response.body?.extensions?.ftv1).toBeDefined()
  })

  it('should contain valid proto tracing details on success', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ hello }',
      })

    expect(response.ok).toBeTruthy()
    expect(response.body?.errors).toBeUndefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)

    const hello = trace.root!.child![0]
    expectTraceNode(hello, 'hello', 'String!')
  })

  it('should contain valid proto tracing details on parse fail', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ he',
      })

    expect(response.body?.errors).toBeDefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)
    expectTraceNodeError(trace.root)
  })

  it('should contain valid proto tracing details on validation fail', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ henlo }',
      })

    expect(response.body?.errors).toBeDefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)
    expectTraceNodeError(trace.root)
  })

  it('should contain valid proto tracing details on execution fail', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ boom }',
      })

    expect(response.body?.errors).toBeDefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)

    const boom = trace.root!.child![0]
    expectTraceNode(boom, 'boom', 'String!')
    expectTraceNodeError(boom)
  })
})

function expectTrace(trace: Trace) {
  expect(trace.startTime).toBeDefined()
  expect(typeof trace.startTime?.seconds).toBe('number')
  expect(typeof trace.startTime?.nanos).toBe('number')

  expect(typeof trace.durationNs).toBe('number')

  expect(trace.endTime).toBeDefined()
  expect(typeof trace.endTime?.seconds).toBe('number')
  expect(typeof trace.endTime?.nanos).toBe('number')

  expect(
    addSecondsAndNanos(trace.startTime!.seconds!, trace.startTime!.nanos!),
  ).toBeLessThan(
    addSecondsAndNanos(trace.endTime!.seconds!, trace.endTime!.nanos!),
  )

  expect(typeof trace.fieldExecutionWeight).toBe('number')

  expect(trace.root).toBeDefined()
  expect(trace.root?.child).toBeInstanceOf(Array)
}

function expectTraceNode(
  node: Trace.INode | null | undefined,
  field: string,
  type: string,
) {
  expect(node).toBeDefined()

  expect(node!.responseName).toBe(field)
  expect(node!.type).toBe(type)
  expect(node!.parentType).toBe('Query')

  expect(typeof node!.startTime).toBe('number')
  expect(typeof node!.endTime).toBe('number')

  expect(node!.startTime!).toBeLessThan(node!.endTime!)
}

function expectTraceNodeError(node: Trace.INode | null | undefined) {
  expect(node).toBeDefined()
  expect(node!.error).toBeDefined()
  const error = node!.error!
  expect(error).toBeInstanceOf(Array)
  expect(typeof error[0].message).toBe('string')
  expect(typeof error[0].location).toBeDefined()
  expect(typeof error[0].location?.[0].line).toBe('number')
  expect(typeof error[0].location?.[0].column).toBe('number')
  expect(() => {
    JSON.parse(error[0].json!)
  }).not.toThrow()
}

function addSecondsAndNanos(seconds: number, nanos: number): number {
  return seconds + nanos / 1e9
}
