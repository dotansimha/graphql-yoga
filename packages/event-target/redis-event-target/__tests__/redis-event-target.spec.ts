import type { TypedEvent } from '@graphql-yoga/typed-event-target'
import Redis from 'ioredis-mock'
import { createRedisEventTarget } from '../src'
import { Event, EventTarget } from '@whatwg-node/fetch'

describe('createRedisEventTarget', () => {
  it('can listen to a simple publish', (done) => {
    const eventTarget = createRedisEventTarget({
      publishClient: new Redis({}),
      subscribeClient: new Redis({}),
    })

    eventTarget.addEventListener('a', (event: TypedEvent) => {
      expect(event.type).toEqual('a')
      expect(event.data).toEqual({
        hi: 1,
      })
      done()
    })

    const event = new Event('a') as TypedEvent
    event.data = { hi: 1 }
    eventTarget.dispatchEvent(event)
  })

  it('does not listen for events for which no lister is set up', (done) => {
    const eventTarget = createRedisEventTarget({
      publishClient: new Redis({}),
      subscribeClient: new Redis({}),
    })

    eventTarget.addEventListener('a', (_event: TypedEvent) => {
      done(new Error('This should not be invoked'))
    })
    eventTarget.addEventListener('b', (event: TypedEvent) => {
      expect(event.type).toEqual('b')
      expect(event.data).toEqual({
        hi: 1,
      })
      done()
    })

    const event = new Event('b') as TypedEvent
    event.data = { hi: 1 }
    eventTarget.dispatchEvent(event)
  })
  it('distributes the event to all event listeners', (done) => {
    const eventTarget = createRedisEventTarget({
      publishClient: new Redis({}),
      subscribeClient: new Redis({}),
    })

    let counter = 0
    eventTarget.addEventListener('b', (_event: TypedEvent) => {
      counter++
    })
    eventTarget.addEventListener('b', (_event: TypedEvent) => {
      counter++
    })

    const event = new Event('b') as TypedEvent
    event.data = { hi: 1 }
    eventTarget.dispatchEvent(event)

    setImmediate(() => {
      expect(counter).toEqual(2)
      done()
    })
  })
})
