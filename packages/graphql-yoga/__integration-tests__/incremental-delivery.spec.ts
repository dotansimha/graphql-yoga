import {
  ExecutionResult,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'
import { createYoga, Plugin } from 'graphql-yoga'
import { createServer, Server } from 'http'
import {
  createFetch,
  AbortController,
  fetch,
  File,
  FormData,
} from '@whatwg-node/fetch'
import getPort from 'get-port'

describe('incremental delivery', () => {
  it('incremental delivery source is closed properly', async () => {
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

    const yoga = createYoga({
      logging: false,
      plugins: [plugin],
    })

    const server = createServer(yoga)

    try {
      await new Promise<void>((resolve) => server.listen(9876, resolve))
      const abortCtrl = new AbortController()
      const res = await yoga.fetchAPI.fetch('http://localhost:9876/graphql', {
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
          valueAsString.includes(
            `Content-Type: application/json; charset=utf-8`,
          )
        ) {
          break
        }
      }
      abortCtrl.abort()
      await new Promise((res) => setTimeout(res, 300))
      expect(fakeIterator.return).toBeCalled()
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})

describe('incremental delivery: node-fetch', () => {
  function createTestSchema(): GraphQLSchema {
    let counter = 0

    const GraphQLFile = new GraphQLScalarType({
      name: 'File',
      description: 'A file',
    })

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: () => ({
          ping: {
            type: GraphQLString,
            resolve: () => 'pong',
          },
        }),
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: () => ({
          echo: {
            type: GraphQLString,
            args: {
              message: { type: GraphQLString },
            },
            resolve: (_, { message }) => message,
          },
          singleUpload: {
            type: new GraphQLObjectType({
              name: 'FileInfo',
              fields: () => ({
                name: { type: GraphQLString },
                type: { type: GraphQLString },
                text: { type: GraphQLString },
              }),
            }),
            description: 'Upload a single file',
            args: {
              file: {
                description: 'File to upload',
                type: GraphQLFile,
              },
            },
            resolve: async (_, { file }: { file: File }) => file,
          },
          parseFileStream: {
            type: GraphQLString,
            description: 'Check if the file stream is valid',
            args: {
              file: {
                description: 'File to check',
                type: GraphQLFile,
              },
            },
            resolve: async (_, { file }: { file: File }) => {
              const chunks = []
              for await (const chunk of file.stream()) {
                chunks.push(Buffer.from(chunk))
              }
              return Buffer.concat(chunks).toString('utf8')
            },
          },
          parseArrayBuffer: {
            type: GraphQLString,
            description: 'Check if the array buffer is valid',
            args: {
              file: {
                description: 'File to check',
                type: GraphQLFile,
              },
            },
            resolve: async (_, { file }: { file: File }) => {
              return Buffer.from(await file.arrayBuffer()).toString('utf8')
            },
          },
        }),
      }),
      subscription: new GraphQLObjectType({
        name: 'Subscription',
        fields: () => ({
          counter: {
            type: GraphQLInt,
            async *subscribe() {
              while (true) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                yield counter++
              }
            },
            resolve: (counter) => counter,
          },
        }),
      }),
    })

    return schema
  }
  const yoga = createYoga({
    logging: false,
    maskedErrors: false,
    fetchAPI: createFetch({
      useNodeFetch: true,
      formDataLimits: {
        fileSize: 12,
      },
    }),
    schema: createTestSchema(),
  })

  let server: Server
  let url: string
  beforeEach(async () => {
    server = createServer(yoga)
    const port = await getPort()
    url = `http://localhost:${port}/graphql`
    await new Promise<void>((resolve) => server.listen(port, resolve))
  })
  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve))
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

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    expect(response.status).toBe(200)
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

    const response = await fetch(url, {
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

    const response = await fetch(url, {
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
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const body = await response.json()

    expect(response.status).toBe(413)

    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('File size limit exceeded: 12 bytes')
  })

  it.skip('should get subscription', async () => {
    // const eventSource = new EventSource(`${url}?query=subscription{counter}`)
    // const counterValue1 = getCounterValue()
    // await new Promise((resolve) => setTimeout(resolve, 300))
    // expect(getCounterValue() > counterValue1).toBe(true)
    // eventSource.close()
    // await new Promise((resolve) => setTimeout(resolve, 300))
    // const counterValue2 = getCounterValue()
    // await new Promise((resolve) => setTimeout(resolve, 300))
    // expect(getCounterValue()).toBe(counterValue2)
  })
})
