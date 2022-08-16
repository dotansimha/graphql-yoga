import { buildApp } from '../src/app.js'
import WebSocket from 'ws'
import { createClient } from 'graphql-ws'

describe('graphql-ws example integration', () => {
  const app = buildApp()
  beforeAll(() => app.start(4000))
  afterAll(() => app.stop())

  it('should execute query', async () => {
    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4000/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: '{ hello }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledWith({ data: { hello: 'world' } })
  })

  it('should subscribe', async () => {
    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4000/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: 'subscription { greetings }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledTimes(5)
    expect(onNext).toBeCalledWith({ data: { greetings: 'Hi' } })
  })
})
