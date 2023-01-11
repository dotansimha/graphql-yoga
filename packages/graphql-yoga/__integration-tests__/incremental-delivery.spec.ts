import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'

import { Push } from '@repeaterjs/repeater'
import { createFetch, fetch, File, FormData } from '@whatwg-node/fetch'
import {
  ExecutionResult,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'

import { createYoga, Plugin, Repeater } from '../src'

describe('incremental delivery', () => {
  it('incremental delivery source is closed properly', async () => {
    let counter = 0

    const fakeIterator: AsyncIterableIterator<ExecutionResult> = {
      [Symbol.asyncIterator]: () => fakeIterator,
      // eslint-disable-next-line @typescript-eslint/require-await
      async next() {
        counter++
        return {
          done: false,
          value: {
            data: {
              counter,
            },
          },
        }
      },
      return: jest.fn(() => Promise.resolve({ done: true, value: undefined })),
    }
    const plugin: Plugin = {
      onExecute(ctx) {
        ctx.setExecuteFn(() => Promise.resolve(fakeIterator) as unknown)
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
      await new Promise<void>(resolve => server.listen(0, resolve))
      const port = (server.address() as AddressInfo).port
      const res = await fetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'multipart/mixed',
        },
        body: JSON.stringify({
          query: /* GraphQL */ `
            query {
              counter
            }
          `,
        }),
      })

      // Start and Close a HTTP Request
      for await (const chunk of res.body!) {
        if (chunk === undefined) {
          break
        }
        const valueAsString = Buffer.from(chunk).toString()
        if (valueAsString.includes(`Content-Type: application/json; charset=utf-8`)) {
          break
        }
      }
      await new Promise(res => setTimeout(res, 300))
      expect(fakeIterator.return).toBeCalled()
    } finally {
      await new Promise(resolve => server.close(resolve))
    }
  })
})

describe('incremental delivery: node-fetch', () => {
  let push: undefined | Push<number, unknown>
  let stop: undefined | (() => void)

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
          resolve: (_, { file }) => file,
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
          resolve: async (_, { file }) => {
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
          resolve: async (_, { file }) => {
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
          subscribe: () =>
            new Repeater<number>((ppush, sstop) => {
              push = ppush
              stop = sstop
            }),
          resolve: counter => counter,
        },
      }),
    }),
  })

  const yoga = createYoga({
    logging: false,
    maskedErrors: false,
    fetchAPI: createFetch({
      useNodeFetch: true,
      formDataLimits: {
        fileSize: 12,
      },
    }),
    schema,
  })

  let server: Server
  let url: string
  beforeEach(async () => {
    server = createServer(yoga)
    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as AddressInfo).port
    url = `http://localhost:${port}/graphql`
  })
  afterEach(async () => {
    await new Promise(resolve => server.close(resolve))
    stop?.()
    stop = undefined
    push = undefined
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
      headers: {
        accept: 'application/graphql-response+json',
      },
      body: formData,
    })

    const body = await response.json()

    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('File size limit exceeded: 12 bytes')

    expect(response.status).toBe(413)
  })

  it('should get subscription', async () => {
    expect.assertions(3)
    let counter = 0
    setTimeout(() => {
      push?.(counter)
    }, 500)
    const response = await fetch(`${url}?query=subscription{counter}`, {
      headers: {
        Accept: 'text/event-stream',
      },
    })
    for await (const chunk of response.body!) {
      const chunkString = Buffer.from(chunk).toString('utf-8')
      if (chunkString.includes('data:')) {
        const result = JSON.parse(chunkString.replace('data:', ''))
        if (counter === 0) {
          expect(result.data.counter).toBe(0)
          counter++
          push?.(counter)
        } else if (counter === 1) {
          expect(result.data.counter).toBe(1)
          counter++
          push?.(counter)
        } else if (counter === 2) {
          expect(result.data.counter).toBe(2)
          counter++
          stop?.()
          return
        }
      }
    }
  })
})
