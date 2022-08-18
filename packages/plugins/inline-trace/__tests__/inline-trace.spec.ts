import request from 'supertest'
import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'http'
import { AddressInfo } from 'net'
import { useInlineTrace } from '../src'
import { Trace } from 'apollo-reporting-protobuf'
import { ExecutionResult, GraphQLError } from 'graphql'
import EventSource from 'eventsource'

describe('Inline Trace', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
        boom: String!
        person: Person!
        people: [Person!]!
      }
      type Subscription {
        hello: String!
      }
      type Person {
        name: String!
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
        person() {
          return { name: 'John' }
        },
        people() {
          return [{ name: 'John' }, { name: 'Jane' }]
        },
      },
      Subscription: {
        hello: {
          async *subscribe() {
            yield { hello: 'world' }
          },
        },
      },
    },
  })

  it('should add ftv1 tracing to result extensions', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
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
    parent: string,
  ) {
    expect(node).toBeDefined()

    expect(node!.responseName).toBe(field)
    expect(node!.type).toBe(type)
    expect(node!.parentType).toBe(parent)

    expect(typeof node!.startTime).toBe('number')
    expect(typeof node!.endTime).toBe('number')

    expect(node!.startTime!).toBeLessThan(node!.endTime!)
  }

  it('should have proto tracing on flat query', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
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
    expect(trace.root?.error?.length).toBe(0)

    const hello = trace.root?.child?.[0]
    expect(hello?.error?.length).toBe(0)
    expectTraceNode(hello, 'hello', 'String!', 'Query')
  })

  it('should have proto tracing on aliased flat query', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ hi: hello }',
      })

    expect(response.ok).toBeTruthy()
    expect(response.body?.errors).toBeUndefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)
    expect(trace.root?.error?.length).toBe(0)

    const hi = trace.root?.child?.[0]
    expect(hi?.error?.length).toBe(0)
    expectTraceNode(hi, 'hi', 'String!', 'Query')
    expect(hi?.originalFieldName).toBe('hello')
  })

  it('should have proto tracing on flat query with array field', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ people { name } }',
      })

    expect(response.ok).toBeTruthy()
    expect(response.body?.errors).toBeUndefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)
    expect(trace.root?.error?.length).toBe(0)

    const people = trace.root?.child?.[0]
    expect(people?.error?.length).toBe(0)
    expectTraceNode(people, 'people', '[Person!]!', 'Query')

    const arr = people!.child!
    for (let i = 0; i < arr.length; i++) {
      const person = arr[i]
      expect(person?.error?.length).toBe(0)
      expect(person.index).toBe(i)
      expectTraceNode(person.child?.[0], 'name', 'String!', 'Person')
    }
  })

  it('should have proto tracing on nested query', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
      .post('/graphql')
      .set({
        'apollo-federation-include-trace': 'ftv1',
      })
      .send({
        query: '{ person { name } }',
      })

    expect(response.ok).toBeTruthy()
    expect(response.body?.errors).toBeUndefined()

    //

    const ftv1 = response.body?.extensions?.ftv1
    const trace = Trace.decode(Buffer.from(ftv1, 'base64'))

    expectTrace(trace)
    expect(trace.root?.error?.length).toBe(0)

    const person = trace.root?.child?.[0]
    expect(person?.error?.length).toBe(0)
    expectTraceNode(person, 'person', 'Person!', 'Query')

    const personName = person?.child?.[0]
    expect(personName?.error?.length).toBe(0)
    expectTraceNode(personName, 'name', 'String!', 'Person')
  })

  function expectTraceNodeError(node: Trace.INode | null | undefined) {
    expect(node).toBeDefined()
    expect(node!.error).toBeDefined()
    const error = node!.error!
    expect(error).toBeInstanceOf(Array)
    expect(error.length).toBeGreaterThan(0)
    expect(typeof error[0].message).toBe('string')
    expect(typeof error[0].location).toBeDefined()
    expect(typeof error[0].location?.[0].line).toBe('number')
    expect(typeof error[0].location?.[0].column).toBe('number')
    expect(() => {
      JSON.parse(error[0].json!)
    }).not.toThrow()
  }

  it('should have proto tracing on parse fail', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
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

  it('should have proto tracing on validation fail', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
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

  it('should have proto tracing on execution fail', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )
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
    expect(trace.root?.error?.length).toBe(0)

    const boom = trace.root?.child?.[0]
    expectTraceNode(boom, 'boom', 'String!', 'Query')
    expectTraceNodeError(boom)
  })

  it('should skip tracing errors through rewriteError', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [
          useInlineTrace({
            rewriteError: () => null,
          }),
        ],
      }),
    )
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
    expect(trace.root?.error?.length).toBe(0)
  })

  it('should rewrite only error messages and extensions through rewriteError', async () => {
    const response = await request(
      createYoga({
        schema,
        plugins: [
          useInlineTrace({
            rewriteError: () =>
              new GraphQLError('bim', { extensions: { str: 'ing' } }),
          }),
        ],
      }),
    )
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
    expect(trace.root?.error?.length).toBe(0)

    const boom = trace.root?.child?.[0]
    expectTraceNode(boom, 'boom', 'String!', 'Query')
    expectTraceNodeError(boom) // will check for location

    const error = boom!.error!
    expect(error[0].message).toBe('bim') // not 'bam'

    const errObj = JSON.parse(error[0].json!)
    expect(errObj.extensions).toEqual({ str: 'ing' })
  })

  it('should not trace subscriptions', async () => {
    const server = createServer(
      createYoga({
        schema,
        plugins: [useInlineTrace()],
      }),
    )

    server.listen(0)
    const { port } = server.address() as AddressInfo
    const url = `http://localhost:${port}/graphql`

    const result = await new Promise<ExecutionResult>((resolve, reject) => {
      const eventSource = new EventSource(`${url}?query=subscription{hello}`)
      eventSource.onmessage = (e) => {
        resolve(JSON.parse(e.data))
        eventSource.close()
      }
      eventSource.onerror = (e) => {
        reject(e)
      }
    })

    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    )

    expect(result.data).toEqual({ hello: 'world' })
    expect(result.errors).toBeUndefined()
    expect(result.extensions).toBeUndefined()
  })
})

function addSecondsAndNanos(seconds: number, nanos: number): number {
  return seconds + nanos / 1e9
}
