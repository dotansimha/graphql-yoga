/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Plugin } from '../src/plugins/types'
import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'
import { YogaInitialContext } from '../src/types'

describe('Context', () => {
  interface UserContext {
    hi: 'there'
  }

  const userContext: UserContext = { hi: 'there' }

  const schema = createSchema<YogaInitialContext & UserContext>({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
      type Subscription {
        greetings: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
      Subscription: {
        greetings: {
          async *subscribe() {
            yield { greetings: 'Hi' }
          },
        },
      },
    },
  })

  it('should provide intial and user context to onExecute', async () => {
    const onExecuteFn = jest.fn((() => {}) as Plugin<
      {},
      {},
      UserContext
    >['onExecute'])

    const yoga = createYoga({
      schema,
      context: userContext,
      plugins: [
        {
          onExecute: onExecuteFn,
        },
      ],
    })

    const response = await yoga.fetch('http://yoga/graphql?query={hello}')
    expect(response.status).toBe(200)

    expect(onExecuteFn.mock.lastCall?.[0].args.contextValue.hi).toBe(
      userContext.hi,
    )
    expect(onExecuteFn.mock.lastCall?.[0].args.contextValue.params)
      .toMatchInlineSnapshot(`
      {
        "extensions": undefined,
        "operationName": undefined,
        "query": "{hello}",
        "variables": undefined,
      }
    `)
    expect(
      onExecuteFn.mock.lastCall?.[0].args.contextValue.request,
    ).toBeDefined()
  })

  it('should provide intial and user context to onSubscribe', async () => {
    const onSubscribeFn = jest.fn((() => {}) as Plugin<
      {},
      {},
      UserContext
    >['onSubscribe'])

    const yoga = createYoga({
      schema,
      context: userContext,
      plugins: [
        {
          onSubscribe: onSubscribeFn,
        },
      ],
    })

    const response = await yoga.fetch(
      'http://yoga/graphql?query=subscription{greetings}',
      {
        headers: {
          Accept: 'text/event-stream',
        },
      },
    )

    expect(response.status).toBe(200)

    expect(onSubscribeFn.mock.lastCall?.[0].args.contextValue.hi).toBe(
      userContext.hi,
    )
    expect(onSubscribeFn.mock.lastCall?.[0].args.contextValue.params)
      .toMatchInlineSnapshot(`
      {
        "extensions": undefined,
        "operationName": undefined,
        "query": "subscription{greetings}",
        "variables": undefined,
      }
    `)
    expect(
      onSubscribeFn.mock.lastCall?.[0].args.contextValue.request,
    ).toBeDefined()
  })

  it('should provide intial context to rest of envelop hooks', async () => {
    const onEnvelopedFn = jest.fn((() => {}) as Plugin['onEnveloped'])
    const onParseFn = jest.fn((() => {}) as Plugin['onParse'])
    const onValidateFn = jest.fn((() => {}) as Plugin['onValidate'])
    const onContextBuildingFn = jest.fn(
      (() => {}) as Plugin['onContextBuilding'],
    )

    const yoga = createYoga({
      schema,
      context: userContext,
      plugins: [
        {
          onEnveloped: onEnvelopedFn,
          onParse: onParseFn,
          onValidate: onValidateFn,
          onContextBuilding: onContextBuildingFn,
        },
      ],
    })

    const response = await yoga.fetch('http://yoga/graphql?query={hello}')
    expect(response.status).toBe(200)

    const params = {
      extensions: undefined,
      operationName: undefined,
      query: '{hello}',
      variables: undefined,
    }

    expect(onEnvelopedFn.mock.lastCall?.[0].context?.params).toEqual(params)
    expect(onEnvelopedFn.mock.lastCall?.[0].context?.request).toBeDefined()

    expect(onParseFn.mock.lastCall?.[0].context.params).toEqual(params)
    expect(onParseFn.mock.lastCall?.[0].context.request).toBeDefined()

    expect(onValidateFn.mock.lastCall?.[0].context.params).toEqual(params)
    expect(onValidateFn.mock.lastCall?.[0].context.request).toBeDefined()

    expect(onContextBuildingFn.mock.lastCall?.[0].context.params).toEqual(
      params,
    )
    expect(onContextBuildingFn.mock.lastCall?.[0].context.request).toBeDefined()
  })
})
