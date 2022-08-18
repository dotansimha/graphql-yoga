import request from 'supertest'
import { createYoga, createSchema } from 'graphql-yoga'
import { useInlineTrace } from '../src'
import { Trace } from 'apollo-reporting-protobuf'

describe('Inline Trace', () => {
  const yoga = createYoga({
    schema: createSchema({
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

    const hello = trace.root!.child![0]

    expect(hello.responseName).toBe('hello')
    expect(hello.type).toBe('String!')
    expect(hello.parentType).toBe('Query')

    expect(typeof hello.startTime).toBe('number')
    expect(typeof hello.endTime).toBe('number')

    expect(hello.startTime!).toBeLessThan(hello.endTime!)
  })
})

function addSecondsAndNanos(seconds: number, nanos: number): number {
  return seconds + nanos / 1e9
}
