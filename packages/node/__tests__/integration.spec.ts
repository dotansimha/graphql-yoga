import { getIntrospectionQuery, IntrospectionQuery } from 'graphql'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import EventSource from 'eventsource'
import request from 'supertest'
import puppeteer from 'puppeteer'
import { createServer, GraphQLYogaError } from '../src'
import { getCounterValue, schema } from '../test-utils/schema'
import { createTestSchema } from './__fixtures__/schema'

const yoga = createServer({ schema, logging: false })

describe('Disable Introspection with plugin', () => {
  it('succeeds introspection query', async () => {
    const { response, executionResult } = await yoga.inject<IntrospectionQuery>(
      {
        document: getIntrospectionQuery(),
      },
    )

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data?.__schema.queryType.name).toBe('Query')
  })

  it('fails introspection query with useDisableIntrospection', async () => {
    const server = createServer({
      schema,
      logging: false,
      // @ts-ignore
      plugins: [useDisableIntrospection()],
    })
    const { response, executionResult } =
      await server.inject<IntrospectionQuery>({
        document: getIntrospectionQuery(),
      })

    expect(response.statusCode).toBe(400)
    expect(executionResult.data).toBeUndefined()
    expect(executionResult.errors![0]).toMatchInlineSnapshot(`
      Object {
        "locations": Array [
          Object {
            "column": 7,
            "line": 3,
          },
        ],
        "message": "GraphQL introspection has been disabled, but the requested query contained the field \\"__schema\\".",
      }
    `)
  })
})

describe('Masked Error Option', () => {
  const typeDefs = /* GraphQL */ `
    type Query {
      hello: String
      hi: String
    }
  `

  const resolvers = {
    Query: {
      hello: () => {
        throw new GraphQLYogaError('This error never gets masked.')
      },
      hi: () => {
        throw new Error('This error will get mask if you enable maskedError.')
      },
    },
  }

  const schema = {
    typeDefs,
    resolvers,
  }

  const initialEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = initialEnv
  })

  it('should mask error', async () => {
    const server = createServer({
      schema,
      maskedErrors: true,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi hello }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![0].message).toBe('Unexpected error.')
    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![1].message).toBe(
      'This error never gets masked.',
    )
  })

  it('should mask error with custom message', async () => {
    const server = createServer({
      schema,
      maskedErrors: { errorMessage: 'Hahahaha' },
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hello hi }',
    })

    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![0].message).toBe(
      'This error never gets masked.',
    )
    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![1].message).toBe('Hahahaha')
  })

  it('should mask errors by default', async () => {
    const server = createServer({
      schema,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi hello }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![0].message).toBe('Unexpected error.')
    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![1].message).toBe(
      'This error never gets masked.',
    )
  })

  it('includes the original error in the extensions in dev mode (isDev flag)', async () => {
    const server = createServer({
      schema,
      logging: false,
      maskedErrors: {
        isDev: true,
      },
    })

    const { executionResult } = await server.inject({
      document: '{ hi }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors?.[0]?.message).toBe('Unexpected error.')
    expect(executionResult.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })
  it('includes the original error in the extensions in dev mode (NODE_ENV=development)', async () => {
    process.env.NODE_ENV = 'development'
    const server = createServer({
      schema,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors?.[0]?.message).toBe('Unexpected error.')
    expect(executionResult.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })
})

describe('Context error', () => {
  it('Error thrown within context factory without error masking is not swallowed and does not include stack trace', async () => {
    const server = createServer({
      logging: false,
      maskedErrors: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })

  it('Error thrown within context factory with error masking is masked', async () => {
    const server = createServer({
      logging: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "Unexpected error.",
          },
        ],
      }
    `)
  })

  it('GraphQLYogaError thrown within context factory with error masking is not masked', async () => {
    const server = createServer({
      logging: false,
      context: () => {
        throw new GraphQLYogaError('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })
})

describe('Requests', () => {
  it('should send basic query', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        query {
          ping
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        mutation {
          echo(message: "hello")
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        mutation ($text: String) {
          echo(message: $text)
        }
      `,
      variables: {
        text: 'hello',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const { executionResult } = await yoga.inject({
      document: '{ query { ping }',
    })

    expect(executionResult.errors).toBeDefined()
    expect(executionResult.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    const { executionResult } = await yoga.inject({ document: null } as any)

    expect(executionResult.data).toBeUndefined()
    expect(executionResult.errors?.[0].message).toBe(
      'Must provide query string.',
    )
  })
})

describe('Incremental Delivery', () => {
  // TODO: Need to find a way to test using fastify inject
  beforeAll(async () => {
    await yoga.start()
  })

  afterAll(async () => {
    await yoga.stop()
  })
  it('should upload a file', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: Upload!) {
        singleUpload(file: $file) {
          name
          type
          text
        }
      }
    `

    const fileName = 'test.txt'
    const fileType = 'text/plain'
    const fileContent = 'Hello World'

    const nodeServer = yoga.getNodeServer()

    const { body } = await request(nodeServer)
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({ query: UPLOAD_MUTATION, variables: { file: null } }),
      )
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', Buffer.from(fileContent), {
        filename: fileName,
        contentType: fileType,
      })

    expect(body.errors).toBeUndefined()
    expect(body.data.singleUpload.name).toBe(fileName)
    expect(body.data.singleUpload.type).toBe(fileType)
    expect(body.data.singleUpload.text).toBe(fileContent)
  })

  it.skip('should get subscription', async () => {
    const serverUrl = yoga.getServerUrl()

    const eventSource = new EventSource(
      `${serverUrl}?query=subscription{counter}`,
    )

    const counterValue1 = getCounterValue()

    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(getCounterValue() > counterValue1).toBe(true)

    eventSource.close()

    await new Promise((resolve) => setTimeout(resolve, 300))

    const counterValue2 = getCounterValue()

    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(getCounterValue()).toBe(counterValue2)
  })
})

describe('health checks', () => {
  const yogaApp = createServer({})
  beforeEach(() => {
    return yogaApp.start()
  })
  afterEach(() => {
    return yogaApp.stop()
  })
  it('should return 200 status code for /health endpoint', () => {
    return request(yogaApp.getNodeServer()).get('/health').expect(200)
  })
  it('should return 200 status code for /readiness endpoint', () => {
    return request(yogaApp.getNodeServer()).get('/readiness').expect(200)
  })
})

describe('GraphiQL', () => {
  const yogaApp = createServer({
    schema: createTestSchema(),
    graphiql: {
      defaultQuery: '',
    },
  })

  let browser: puppeteer.Browser
  let page: puppeteer.Page

  const playButtonSelector = `[d="M 11 9 L 24 16 L 11 23 z"]`
  const stopButtonSelector = `[d="M 10 10 L 23 10 L 23 23 L 10 23 z"]`

  beforeAll(async () => {
    await yogaApp.start()
    browser = await puppeteer.launch({
      // If you wanna run tests with open browser
      // set your PUPPETEER_HEADLESS env to "false"
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: ['--incognito'],
    })
  })
  beforeEach(async () => {
    if (page !== undefined) {
      await page.close()
    }
    const context = await browser.createIncognitoBrowserContext()
    page = await context.newPage()
  })
  afterAll(async () => {
    await browser.close()
    await yogaApp.stop()
  })

  const typeOperationText = async (text: string) => {
    await page.type('.query-editor .CodeMirror textarea', text)
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise((res) => setTimeout(res, 100))
  }

  const typeVariablesText = async (text: string) => {
    await page.type('.variable-editor .CodeMirror textarea', text)
    // TODO: figure out how we can avoid this wait
    // it is very likely that there is a delay from textarea -> react state update
    await new Promise((res) => setTimeout(res, 100))
  }

  const waitForResult = async () => {
    await page.waitForFunction(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      () => !!window.g.resultComponent.viewer.getValue(),
    )
    const resultContents = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return window.g.resultComponent.viewer.getValue()
    })

    return resultContents
  }

  it('execute simple query operation', async () => {
    await page.goto(`http://localhost:4000/graphql`)
    await typeOperationText('{ alwaysTrue }')

    await page.click('.execute-button')
    const resultContents = await waitForResult()

    expect(resultContents).toEqual(
      JSON.stringify(
        {
          data: {
            alwaysTrue: true,
          },
        },
        null,
        2,
      ),
    )
  })

  it('execute mutation operation', async () => {
    await page.goto(`http://localhost:4000/graphql`)
    await typeOperationText(
      `mutation ($number: Int!) {  setFavoriteNumber(number: $number) }`,
    )
    await typeVariablesText(`{ "number": 3 }`)
    await page.click('.execute-button')
    const resultContents = await waitForResult()

    expect(resultContents).toEqual(
      JSON.stringify(
        {
          data: {
            setFavoriteNumber: 3,
          },
        },
        null,
        2,
      ),
    )
  })

  test('execute SSE (subscription) operation', async () => {
    await page.goto(`http://localhost:4000/graphql`)
    await typeOperationText(`subscription { count(to: 2) }`)
    await page.click('.execute-button')

    await new Promise((res) => setTimeout(res, 50))

    const [resultContents, isShowingStopButton] = await page.evaluate(
      (stopButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(stopButtonSelector),
        ]
      },
      stopButtonSelector,
    )
    expect(JSON.parse(resultContents)).toEqual({
      data: {
        count: 1,
      },
    })
    expect(isShowingStopButton).toEqual(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const [resultContents1, isShowingPlayButton] = await page.evaluate(
      (playButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(playButtonSelector),
        ]
      },
      playButtonSelector,
    )
    expect(JSON.parse(resultContents1)).toEqual({
      data: {
        count: 2,
      },
    })
    expect(isShowingPlayButton).toEqual(true)
  })
})
