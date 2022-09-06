import { getIntrospectionQuery } from 'graphql'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import EventSource from 'eventsource'
import request from 'supertest'
import puppeteer from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { CORSOptions, createServer, GraphQLYogaError } from '../src/index.js'
import { getCounterValue, schema } from '../test-utils/schema.js'
import { createTestSchema } from './__fixtures__/schema.js'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import 'json-bigint-patch'
import http from 'http'
import { useLiveQuery } from '@envelop/live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { AbortController, fetch, File, FormData } from '@whatwg-node/fetch'
import { Plugin } from '@graphql-yoga/common'
import { ExecutionResult } from '@graphql-tools/utils'

describe('Disable Introspection with plugin', () => {
  it('succeeds introspection query', async () => {
    const yoga = createServer({ schema, logging: false })
    const response = await request(yoga).post('/graphql').send({
      query: getIntrospectionQuery(),
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data?.__schema.queryType.name).toBe('Query')
  })

  it('fails introspection query with useDisableIntrospection', async () => {
    const yoga = createServer({
      schema,
      logging: false,
      // @ts-ignore
      plugins: [useDisableIntrospection()],
    })
    const response = await request(yoga).post('/graphql').send({
      query: getIntrospectionQuery(),
    })

    expect(response.statusCode).toBe(400)
    expect(response.headers['content-type']).toBe('application/json')
    expect(response.body.data).toBeNull()
    expect(response.body.errors![0]).toMatchInlineSnapshot(`
      {
        "extensions": {},
        "locations": [
          {
            "column": 7,
            "line": 3,
          },
        ],
        "message": "GraphQL introspection has been disabled, but the requested query contained the field "__schema".",
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
    const yoga = createServer({
      schema,
      maskedErrors: true,
      logging: false,
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ hi hello }',
    })

    const body = JSON.parse(response.text)
    expect(body.data.hi).toBeNull()
    expect(body.errors![0].message).toBe('Unexpected error.')
    expect(body.data.hello).toBeNull()
    expect(body.errors![1].message).toBe('This error never gets masked.')
  })

  it('should mask error with custom message', async () => {
    const yoga = createServer({
      schema,
      maskedErrors: { errorMessage: 'Hahahaha' },
      logging: false,
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ hello hi }',
    })

    const body = JSON.parse(response.text)
    expect(body.data.hello).toBeNull()
    expect(body.errors![0].message).toBe('This error never gets masked.')
    expect(body.data.hi).toBeNull()
    expect(body.errors![1].message).toBe('Hahahaha')
  })

  it('should mask errors by default', async () => {
    const yoga = createServer({
      schema,
      logging: false,
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ hi hello }',
    })

    const body = JSON.parse(response.text)
    expect(body.data.hi).toBeNull()
    expect(body.errors![0].message).toBe('Unexpected error.')
    expect(body.data.hello).toBeNull()
    expect(body.errors![1].message).toBe('This error never gets masked.')
  })

  it('includes the original error in the extensions in dev mode (isDev flag)', async () => {
    const yoga = createServer({
      schema,
      logging: false,
      maskedErrors: {
        isDev: true,
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ hi hello }',
    })

    const body = JSON.parse(response.text)
    expect(body.data.hi).toBeNull()
    expect(body.errors?.[0]?.message).toBe('Unexpected error.')
    expect(body.errors?.[0]?.extensions).toStrictEqual({
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
    const yoga = createServer({
      schema,
      logging: false,
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ hi hello }',
    })

    const body = JSON.parse(response.text)
    expect(body.data.hi).toBeNull()
    expect(body.errors?.[0]?.message).toBe('Unexpected error.')
    expect(body.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })

  it('can mask validation error', async () => {
    const yoga = createServer({
      schema,
      logging: false,
      maskedErrors: {
        handleValidationErrors: true,
        isDev: true,
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ bubatzbieber }',
    })
    const body = JSON.parse(response.text)
    expect(body).toMatchObject({
      data: null,
      errors: [
        {
          locations: [
            {
              column: 3,
              line: 1,
            },
          ],
          message: 'Unexpected error.',
        },
      ],
    })
    const { extensions } = body.errors![0]
    expect(extensions).toMatchObject({
      originalError: {
        message: 'Cannot query field "bubatzbieber" on type "Query".',
        stack: expect.stringContaining(
          'GraphQLError: Cannot query field "bubatzbieber" on type "Query"',
        ),
      },
    })
  })
})

describe('Context error', () => {
  it('Error thrown within context factory without error masking is not swallowed and does not include stack trace', async () => {
    const yoga = createServer({
      logging: false,
      maskedErrors: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ greetings }',
    })
    const body = JSON.parse(response.text)
    expect(body).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })

  it('Error thrown within context factory with error masking is masked', async () => {
    const yoga = createServer({
      logging: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ greetings }',
    })
    const body = JSON.parse(response.text)
    expect(body).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          {
            "message": "Unexpected error.",
          },
        ],
      }
    `)
  })

  it('GraphQLYogaError thrown within context factory with error masking is not masked', async () => {
    const yoga = createServer({
      logging: false,
      context: () => {
        throw new GraphQLYogaError('I like turtles')
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ greetings }',
    })
    const body = JSON.parse(response.text)
    expect(body).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })

  it('GraphQLYogaError thrown within context factory has error extensions exposed on the response', async () => {
    const yoga = createServer({
      logging: false,
      context: () => {
        throw new GraphQLYogaError('I like turtles', { foo: 1 })
      },
    })

    const response = await request(yoga).post('/graphql').send({
      query: '{ greetings }',
    })
    const body = JSON.parse(response.text)
    expect(body).toStrictEqual({
      data: null,
      errors: [
        {
          message: 'I like turtles',
          extensions: {
            foo: 1,
          },
        },
      ],
    })
    expect(response.status).toEqual(200)
  })

  it('error thrown within context factory is exposed via originalError extension field in dev mode', async () => {
    const yoga = createServer({
      logging: false,
      context: () => {
        throw new Error('I am the original error.')
      },
      maskedErrors: {
        isDev: true,
      },
    })
    const response = await request(yoga).post('/graphql').send({
      query: '{ greetings }',
    })
    const body = JSON.parse(response.text)
    expect(body).toStrictEqual({
      data: null,
      errors: [
        {
          message: 'Unexpected error.',
          extensions: {
            originalError: {
              message: 'I am the original error.',
              stack: expect.stringContaining('Error: I am the original error.'),
            },
          },
        },
      ],
    })
    expect(response.status).toEqual(200)
  })
})

it('parse error is sent to clients', async () => {
  const server = createServer({
    logging: false,
  })

  try {
    await server.start()

    const result = await fetch(server.getServerUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls' }),
    }).then((_) => _.json())

    expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          {
            "extensions": {},
            "locations": [
              {
                "column": 10,
                "line": 1,
              },
            ],
            "message": "Syntax Error: Expected Name, found <EOF>.",
          },
        ],
      }
    `)
  } finally {
    await server.stop()
  }
})

it('validation error is sent to clients', async () => {
  const server = createServer({
    logging: false,
  })

  try {
    await server.start()

    const result = await fetch(server.getServerUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls}' }),
    }).then((_) => _.json())

    expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          {
            "extensions": {},
            "locations": [
              {
                "column": 2,
                "line": 1,
              },
            ],
            "message": "Cannot query field "libl_pls" on type "Query".",
          },
        ],
      }
    `)
  } finally {
    await server.stop()
  }
})

describe('Requests', () => {
  const endpoint = '/test-graphql'
  const yoga = createServer({ schema, logging: false, endpoint })

  it('should reject other paths if specific endpoint path is provided', async () => {
    const response = await request(yoga).get('/graphql')
    expect(response.status).toBe(404)
  })

  it('should send basic query', async () => {
    const response = await request(yoga).post(endpoint).send({
      query: '{ ping }',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('should send basic query with GET', async () => {
    const response = await request(yoga)
      .get(endpoint + '?query=' + encodeURIComponent('{ ping }'))
      .send()

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('sending mutation over GET method is prohibited', async () => {
    const response = await request(yoga)
      .get(endpoint + '?query=' + encodeURIComponent('mutation { __typename }'))
      .send()

    expect(response.statusCode).toBe(405)

    expect(response.headers['allow']).toBe('POST')
    const body = JSON.parse(response.text)

    expect(body.data).toEqual(null)
    expect(body.errors).toHaveLength(1)
    expect(body.errors[0].message).toEqual(
      'Can only perform a mutation operation from a POST request.',
    )
  })

  it('should send basic mutation', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .send({
        query: /* GraphQL */ `
          mutation {
            echo(message: "hello")
          }
        `,
      })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .send({
        query: /* GraphQL */ `
          mutation ($text: String) {
            echo(message: $text)
          }
        `,
        variables: {
          text: 'hello',
        },
      })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.echo).toBe('hello')
  })

  it('should error on malformed JSON parameters', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .send('{ "query": "{ ping }"')

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.text)

    expect(body.errors).toBeDefined()
    expect(body.data).toBeNull()
  })

  it('should error on malformed query string', async () => {
    const response = await request(yoga).post(endpoint).send({
      query: '{ query { ping }',
    })

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.text)

    expect(body.errors).toBeDefined()
    expect(body.data).toBeNull()
  })

  it('should error missing query', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .send({
        query: null,
      } as any)

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.text)
    expect(body.data).toBeNull()
    expect(body.errors?.[0].message).toBe('Must provide query string.')
  })

  it('should error if query is not a string', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .send({
        query: { ping: 'pong' },
      } as any)

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.text)
    expect(body.data).toBeNull()
    expect(body.errors?.[0].message).toBe(
      'Expected "query" to be "string" but given "object".',
    )
  })

  it('should handle preflight requests correctly', () => {
    return request(yoga)
      .options(endpoint)
      .set('Access-Control-Request-Method', 'POST')
      .set('Origin', 'http://localhost:3000')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3000')
      .expect('Access-Control-Allow-Methods', 'POST')
  })

  it('should handle POST requests with a GraphQL operation string', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .set('Content-Type', 'application/graphql')
      .send(`{ ping }`)

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('should handle POST requests with url encoded string', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(`query=${encodeURIComponent('{ ping }')}`)

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('should handle POST requests as JSON with "application/graphql+json" content type', async () => {
    const response = await request(yoga)
      .post(endpoint)
      .set('Content-Type', 'application/graphql+json')
      .send(JSON.stringify({ query: '{ ping }' }))

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })
})

describe('Incremental Delivery', () => {
  const yoga = createServer({
    schema,
    logging: false,
    maskedErrors: false,
    multipart: {
      fileSize: 12,
    },
  })
  beforeAll(() => {
    return yoga.start()
  })
  afterAll(() => {
    return yoga.stop()
  })
  it('should upload a file', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: File!) {
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

    const formData = new FormData()
    formData.set('operations', JSON.stringify({ query: UPLOAD_MUTATION }))
    formData.set('map', JSON.stringify({ 0: ['variables.file'] }))
    formData.set('0', new File([fileContent], fileName, { type: fileType }))

    const response = await fetch(yoga.getServerUrl(), {
      method: 'POST',
      body: formData,
    })

    const body = await response.json()

    expect(body.errors).toBeUndefined()
    expect(body.data.singleUpload.name).toBe(fileName)
    expect(body.data.singleUpload.type).toBe(fileType)
    expect(body.data.singleUpload.text).toBe(fileContent)
  })

  it('should provide a correct readable stream', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: File!) {
        parseFileStream(file: $file)
      }
    `

    const fileName = 'test.txt'
    const fileType = 'text/plain'
    const fileContent = 'Hello World'

    const formData = new FormData()
    formData.set('operations', JSON.stringify({ query: UPLOAD_MUTATION }))
    formData.set('map', JSON.stringify({ 0: ['variables.file'] }))
    formData.set('0', new File([fileContent], fileName, { type: fileType }))

    const response = await fetch(yoga.getServerUrl(), {
      method: 'POST',
      body: formData,
    })

    const body = await response.json()

    expect(body.errors).toBeUndefined()
    expect(body.data.parseFileStream).toBe(fileContent)
  })

  it('should provide a correct readable stream', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: File!) {
        parseArrayBuffer(file: $file)
      }
    `

    const fileName = 'test.txt'
    const fileType = 'text/plain'
    const fileContent = 'Hello World'

    const formData = new FormData()
    formData.set('operations', JSON.stringify({ query: UPLOAD_MUTATION }))
    formData.set('map', JSON.stringify({ 0: ['variables.file'] }))
    formData.set('0', new File([fileContent], fileName, { type: fileType }))

    const response = await fetch(yoga.getServerUrl(), {
      method: 'POST',
      body: formData,
    })

    const body = await response.json()

    expect(body.errors).toBeUndefined()
    expect(body.data.parseArrayBuffer).toBe(fileContent)
  })

  it('should not allow the files that exceed the limit', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: File!) {
        singleUpload(file: $file) {
          name
          type
          text
        }
      }
    `

    const fileName = 'test.txt'
    const fileType = 'text/plain'
    const fileContent = 'I am a very long string that exceeds the limit'

    const formData = new FormData()
    formData.set('operations', JSON.stringify({ query: UPLOAD_MUTATION }))
    formData.set('map', JSON.stringify({ 0: ['variables.file'] }))
    formData.set('0', new File([fileContent], fileName, { type: fileType }))
    const response = await fetch(yoga.getServerUrl(), {
      method: 'POST',
      body: formData,
    })

    const body = await response.json()

    expect(response.status).toBe(413)

    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('File size limit exceeded: 12 bytes')
  })

  it('should get subscription', async () => {
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

  it('should accept POST requests as "application/json" by default if content-type is not present', async () => {
    const response = await yoga.fetch(yoga.getServerUrl(), {
      method: 'POST',
      body: JSON.stringify({ query: '{ ping }' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })
})

function md5File(path: string) {
  return new Promise((resolve, reject) => {
    const output = crypto.createHash('md5')
    const input = fs.createReadStream(path)

    input.on('error', (err) => {
      reject(err)
    })

    output.once('readable', () => {
      resolve(output.read().toString('hex'))
    })

    input.pipe(output)
  })
}

describe('file uploads', () => {
  it('uploading and streaming a binary file succeeds', async () => {
    const sourceFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'website',
      'public',
      'logo.png',
    )
    const sourceMd5 = await md5File(sourceFilePath)
    const id = crypto.randomBytes(20).toString('hex')
    const targetFilePath = path.join(os.tmpdir(), `${id}.png`)

    const server = createServer({
      schema: {
        resolvers: {
          Mutation: {
            uploadFile: async (root, args) => {
              await fs.promises.writeFile(
                targetFilePath,
                Buffer.from(await args.file.arrayBuffer()),
              )
              return true
            },
          },
        },
        typeDefs: /* GraphQL */ `
          scalar File

          type Query {
            _: Boolean
          }
          type Mutation {
            uploadFile(file: File!): Boolean
          }
        `,
      },
      logging: false,
    })

    try {
      await server.start()

      const formData = new FormData()
      formData.set(
        'operations',
        JSON.stringify({
          query: /* GraphQL */ `
            mutation uploadFile($file: File!) {
              uploadFile(file: $file)
            }
          `,
        }),
      )
      formData.set('map', JSON.stringify({ 0: ['variables.file'] }))
      formData.set(
        '0',
        new File(
          [await fs.promises.readFile(sourceFilePath)],
          path.basename(sourceFilePath),
        ),
      )

      const response = await fetch(server.getServerUrl(), {
        method: 'POST',
        body: formData,
      })

      const body = await response.json()
      expect(body.errors).toBeUndefined()
      expect(body.data).toEqual({
        uploadFile: true,
      })

      await fs.promises.stat(targetFilePath)
      const targetMd5 = await md5File(targetFilePath)
      expect(targetMd5).toEqual(sourceMd5)
      fs.promises.unlink(targetFilePath)
    } finally {
      await server.stop()
    }
  })
})

describe('health checks', () => {
  const yogaApp = createServer({
    logging: false,
  })
  it('should return 200 status code for health check endpoint', async () => {
    const result = await request(yogaApp).get('/health')
    expect(result.status).toBe(200)
    expect(result.body.message).toBe('alive')
  })
  it('should return 200 status code for readiness check endpoint', async () => {
    const result = await request(yogaApp).get('/readiness')
    expect(result.status).toBe(200)
    expect(result.body.message).toBe('ready')
  })
})

it('should expose Node req and res objects in the context', async () => {
  const yoga = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          isNode: Boolean!
        }
      `,
      resolvers: {
        Query: {
          isNode: (_, __, { req, res }) => !!req && !!res,
        },
      },
    },
    logging: false,
  })
  const response = await request(yoga)
    .post('/graphql')
    .send({
      query: /* GraphQL */ `
        query {
          isNode
        }
      `,
    })

  expect(response.statusCode).toBe(200)
  const body = JSON.parse(response.text)
  expect(body.errors).toBeUndefined()
  expect(body.data.isNode).toBe(true)
})

test('Subscription is closed properly', async () => {
  let counter = 0
  let resolve: () => void = () => {
    throw new Error('Noop')
  }

  const p = new Promise<IteratorResult<void>>((res) => {
    resolve = () => res({ done: true, value: undefined })
  })

  const fakeIterator: AsyncIterableIterator<unknown> = {
    [Symbol.asyncIterator]: () => fakeIterator,
    next: () => {
      if (counter === 0) {
        counter = counter + 1
        return Promise.resolve({ done: false, value: 'a' })
      }
      return p
    },
    return: jest.fn(() => Promise.resolve({ done: true, value: undefined })),
  }
  const server = createServer({
    logging: false,
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          _: Boolean
        }
        type Subscription {
          foo: String
        }
      `,
      resolvers: {
        Subscription: {
          foo: {
            resolve: () => 'bar',
            subscribe: () => fakeIterator,
          },
        },
      },
    },
    port: 9876,
  })
  try {
    await server.start()

    // Start and Close a HTTP SSE subscription
    await new Promise<void>((res) => {
      const eventSource = new EventSource(
        `${server.getServerUrl()}?query=subscription{foo}`,
      )
      eventSource.onmessage = (ev) => {
        eventSource.close()
        res()
      }
    })
    resolve()

    // very small timeout to make sure the subscription is closed
    await new Promise((res) => setTimeout(res, 30))
    expect(fakeIterator.return).toHaveBeenCalled()
  } finally {
    await server.stop()
  }
})

test('defer/stream is closed properly', async () => {
  let counter = 0
  let resolve: () => void = () => {
    throw new Error('Noop')
  }

  const p = new Promise<IteratorResult<ExecutionResult>>((res) => {
    resolve = () => res({ done: true, value: { data: 'end' } })
  })

  const fakeIterator: AsyncIterableIterator<ExecutionResult> = {
    [Symbol.asyncIterator]: () => fakeIterator,
    next: () => {
      if (counter === 0) {
        counter = counter + 1
        return Promise.resolve({
          done: false,
          value: { data: 'turtles' },
        } as any)
      }
      return p
    },
    return: jest.fn(() => Promise.resolve({ done: true, value: undefined })),
  }
  const plugin: Plugin = {
    onExecute(ctx) {
      ctx.setExecuteFn(() => Promise.resolve(fakeIterator) as any)
    },
    /* skip validation :) */
    onValidate(ctx) {
      ctx.setValidationFn(() => [])
    },
  }

  const server = createServer({
    logging: false,
    plugins: [plugin],
    port: 9875,
  })

  try {
    await server.start()
    const abortCtrl = new AbortController()
    const res = await fetch(server.getServerUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'multipart/mixed',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query {
            a
          }
        `,
      }),
      signal: abortCtrl.signal,
    })

    // Start and Close a HTTP Request
    for await (const chunk of res.body!) {
      if (chunk === undefined) {
        break
      }
      const valueAsString = Buffer.from(chunk).toString()
      if (
        valueAsString.includes(`Content-Type: application/json; charset=utf-8`)
      ) {
        abortCtrl.abort()
        break
      }
    }
    await new Promise((res) => setTimeout(res, 300))
    expect(fakeIterator.return).toBeCalled()
  } finally {
    await server.stop()
  }
})

describe('Browser', () => {
  const liveQueryStore = new InMemoryLiveQueryStore()
  const endpoint = '/test-graphql'
  let cors: CORSOptions = {}
  const yogaApp = createServer({
    schema: createTestSchema(),
    cors: () => cors,
    logging: false,
    endpoint,
    plugins: [
      useLiveQuery({
        liveQueryStore,
      }),
    ],
    renderGraphiQL,
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

  describe('GraphiQL', () => {
    it('execute simple query operation', async () => {
      await page.goto(`http://localhost:4000${endpoint}`)
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
      await page.goto(`http://localhost:4000${endpoint}`)
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
      await page.goto(`http://localhost:4000${endpoint}`)
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

    test('show the query provided in the search param', async () => {
      const query = '{ alwaysTrue }'
      await page.goto(
        `http://localhost:4000${endpoint}?query=${encodeURIComponent(query)}`,
      )
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

    test('should show BigInt correctly', async () => {
      await page.goto(`http://localhost:4000/${endpoint}`)
      await typeOperationText(`{ bigint }`)
      await page.click('.execute-button')
      const resultContents = await waitForResult()

      expect(resultContents).toEqual(`{
  "data": {
    "bigint": ${BigInt('112345667891012345')}
  }
}`)
    })
    test('should show live queries correctly', async () => {
      await page.goto(`http://localhost:4000${endpoint}`)
      await typeOperationText(`query @live { liveCounter }`)
      await page.click('.execute-button')

      await new Promise((res) => setTimeout(res, 50))

      const [resultContents] = await page.evaluate((stopButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(stopButtonSelector),
        ]
      }, stopButtonSelector)
      const resultJson = JSON.parse(resultContents)

      expect(resultJson).toEqual({
        data: {
          liveCounter: 1,
        },
        isLive: true,
      })
      liveQueryStore.invalidate('Query.liveCounter')

      const watchDog = await page.waitForFunction(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const value = window.g.resultComponent.viewer.getValue()

        return value.includes('2')
      })

      await watchDog

      const [resultContents1] = await page.evaluate((playButtonSelector) => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.g.resultComponent.viewer.getValue(),
          !!window.document.querySelector(playButtonSelector),
        ]
      }, playButtonSelector)
      const resultJson1 = JSON.parse(resultContents1)
      expect(resultJson1).toEqual({
        data: {
          liveCounter: 2,
        },
        isLive: true,
      })
    })
  })

  describe('CORS', () => {
    const anotherOriginPort = 4000 + Math.floor(Math.random() * 1000)
    const anotherServer = http.createServer((req, res) => {
      res.end(/* HTML */ `
        <html>
          <head>
            <title>Another Origin</title>
          </head>
          <body>
            <h1>Another Origin</h1>
            <p id="result">RESULT_HERE</p>
            <script>
              async function fetchData() {
                try {
                  const response = await fetch(
                    'http://localhost:4000${endpoint}',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        query: '{ alwaysTrue }',
                      }),
                    },
                  )
                  document.getElementById('result').innerHTML =
                    await response.text()
                } catch (e) {
                  document.getElementById('result').innerHTML = e.stack
                }
              }
              fetchData()
            </script>
          </body>
        </html>
      `)
    })
    beforeAll(async () => {
      await new Promise<void>((resolve) =>
        anotherServer.listen(anotherOriginPort, () => resolve()),
      )
    })
    afterAll(async () => {
      await new Promise<void>((resolve) => anotherServer.close(() => resolve()))
    })
    test('allow other origins by default', async () => {
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
    test('allow if specified', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
    test('restrict other origins if provided', async () => {
      cors = {
        origin: ['http://localhost:4000'],
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toContain('Failed to fetch')
    })
    test('send specific origin back to user if credentials are set true', async () => {
      cors = {
        origin: [`http://localhost:${anotherOriginPort}`],
        credentials: true,
      }
      await page.goto(`http://localhost:${anotherOriginPort}`)
      const result = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return document.getElementById('result')?.innerHTML
      })
      expect(result).toEqual(
        JSON.stringify({
          data: {
            alwaysTrue: true,
          },
        }),
      )
    })
  })
})
