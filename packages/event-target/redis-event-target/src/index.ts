import {
  type TypedEventTarget,
  type EventAPI,
  resolveGlobalConfig,
} from '@graphql-yoga/typed-event-target'
import type { Redis, Cluster } from 'ioredis'

export type CreateRedisEventTargetArgs = {
  publishClient: Redis | Cluster
  subscribeClient: Redis | Cluster
  /**
   * Event and EventTarget implementation.
   * Providing this is mandatory for a Node.js versions below 16.
   */
  event?: EventAPI
}

export function createRedisEventTarget<TEvent extends Event>(
  args: CreateRedisEventTargetArgs,
): TypedEventTarget<TEvent> {
  const { publishClient, subscribeClient } = args
  const eventAPI = resolveGlobalConfig(args.event)

  const callbacksForTopic = new Map<string, Set<(event: TEvent) => void>>()

  function onMessage(channel: string, message: string) {
    const callbacks = callbacksForTopic.get(channel)
    if (callbacks === undefined) {
      return
    }
    const event = new eventAPI.Event(channel) as TEvent & {
      data: unknown
    }
    event.data = message === '' ? undefined : JSON.parse(message)
    for (const callback of callbacks) {
      callback(event)
    }
  }

  subscribeClient.on('message', onMessage)

  function addCallback(topic: string, callback: (event: TEvent) => void) {
    let callbacks = callbacksForTopic.get(topic)
    if (callbacks === undefined) {
      callbacks = new Set()
      callbacksForTopic.set(topic, callbacks)

      subscribeClient.subscribe(topic)
    }
    callbacks.add(callback)
  }

  function removeCallback(topic: string, callback: (event: TEvent) => void) {
    let callbacks = callbacksForTopic.get(topic)
    if (callbacks === undefined) {
      return
    }
    callbacks.delete(callback)
    if (callbacks.size > 0) {
      return
    }
    callbacksForTopic.delete(topic)
    subscribeClient.unsubscribe(topic)
  }

  return {
    addEventListener(topic, callbackOrOptions) {
      const callback =
        'handleEvent' in callbackOrOptions
          ? callbackOrOptions.handleEvent
          : callbackOrOptions
      addCallback(topic, callback)
    },
    dispatchEvent(event: TEvent) {
      publishClient.publish(
        event.type,
        (event as any).data === undefined
          ? ''
          : JSON.stringify((event as any).data),
      )
      return true
    },
    removeEventListener(topic, callbackOrOptions) {
      const callback =
        'handleEvent' in callbackOrOptions
          ? callbackOrOptions.handleEvent
          : callbackOrOptions
      removeCallback(topic, callback)
    },
  }
}
