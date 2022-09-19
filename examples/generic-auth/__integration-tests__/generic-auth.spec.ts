import { yoga } from '../src/main'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { fetch } from '@whatwg-node/fetch'
import EventSource from 'eventsource'

describe('graphql-auth example integration', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('should execute public field', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{public}`,
    )
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      public: 'Hi',
    })
  })

  it('should throw error on executing auth required field', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{requiresAuth}`,
    )
    const body = await response.json()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe(
      "Accessing 'Query.requiresAuth' requires authentication.",
    )
    expect(body.data).toBeNull()
  })

  it('should execute on auth required field', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{requiresAuth}`,
      {
        headers: {
          'x-authorization': 'aaa',
        },
      },
    )
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      requiresAuth: 'hi foo@foo.com',
    })
  })

  it('should execute on public field with subscription', async () => {
    const eventSource = new EventSource(
      `http://localhost:${port}/graphql?query=subscription{public}`,
    )

    const messages: string[] = []
    try {
      await new Promise<void>((resolve, reject) => {
        eventSource.onmessage = (message) => {
          messages.push(message.data)
          eventSource.close()
          resolve()
        }
        eventSource.onerror = (error) => {
          reject(error)
        }
      })

      expect(messages).toMatchInlineSnapshot(`
        [
          "{"data":{"public":"hi"}}",
        ]
      `)
    } finally {
      eventSource.close()
    }
  })

  it('should execute on auth required field with subscription', async () => {
    const eventSource = new EventSource(
      `http://localhost:${port}/graphql?query=subscription{requiresAuth}`,
      {
        headers: {
          'x-authorization': 'aaa',
        },
      },
    )

    const messages: string[] = []
    try {
      await new Promise<void>((resolve, reject) => {
        eventSource.onmessage = (message) => {
          messages.push(message.data)
          eventSource.close()
          resolve()
        }
        eventSource.onerror = (error) => {
          reject(error)
        }
      })

      expect(messages).toMatchInlineSnapshot(`
        [
          "{"data":{"requiresAuth":"hi foo@foo.com"}}",
        ]
      `)
    } finally {
      eventSource.close()
    }
  })

  it('should not execute on auth required field with subscription', async () => {
    const eventSource = new EventSource(
      `http://localhost:${port}/graphql?query=subscription{requiresAuth}`,
    )

    const messages: string[] = []
    try {
      await new Promise<void>((resolve, reject) => {
        eventSource.onmessage = (message) => {
          messages.push(message.data)
          eventSource.close()
          resolve()
        }
        eventSource.onerror = (error) => {
          reject(error)
        }
      })
    } catch (err) {
      expect(err.message).toEqual('Internal Server Error')
    } finally {
      eventSource.close()
    }
  })
})
