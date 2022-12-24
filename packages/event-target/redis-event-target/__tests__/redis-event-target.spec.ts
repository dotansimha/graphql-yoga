import Redis from 'ioredis-mock'
import { createRedisEventTarget } from '../src'
import { CustomEvent } from '@whatwg-node/events'

describe('createRedisEventTarget', () => {
  it('can listen to a simple publish', () =>
    new Promise<void>((done) => {
      const eventTarget = createRedisEventTarget({
        publishClient: new Redis({}),
        subscribeClient: new Redis({}),
      })

      eventTarget.addEventListener('a', (event: CustomEvent) => {
        expect(event.type).toEqual('a')
        expect(event.detail).toEqual({
          hi: 1,
        })
        done()
      })

      const event = new CustomEvent('a', {
        detail: {
          hi: 1,
        },
      })
      eventTarget.dispatchEvent(event)
    }))

  it('does not listen for events for which no lister is set up', () =>
    new Promise<void | Error>((done) => {
      const eventTarget = createRedisEventTarget({
        publishClient: new Redis({}),
        subscribeClient: new Redis({}),
      })

      eventTarget.addEventListener('a', (_event: CustomEvent) => {
        done(new Error('This should not be invoked'))
      })
      eventTarget.addEventListener('b', (event: CustomEvent) => {
        expect(event.type).toEqual('b')
        expect(event.detail).toEqual({
          hi: 1,
        })
        done()
      })

      const event = new CustomEvent('b', {
        detail: {
          hi: 1,
        },
      })
      eventTarget.dispatchEvent(event)
    }))
  
  it('distributes the event to all event listeners', () =>
    new Promise<void>((done) => {
      const eventTarget = createRedisEventTarget({
        publishClient: new Redis({}),
        subscribeClient: new Redis({}),
      })

      let counter = 0
      eventTarget.addEventListener('b', (_event: CustomEvent) => {
        counter++
      })
      eventTarget.addEventListener('b', (_event: CustomEvent) => {
        counter++
      })

      const event = new CustomEvent('b', {
        detail: {
          hi: 1,
        },
      })
      eventTarget.dispatchEvent(event)

      setImmediate(() => {
        expect(counter).toEqual(2)
        done()
      })
    }))
})
