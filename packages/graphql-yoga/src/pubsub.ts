type PubSubPublishArgsByKey = {
  [key: string]: [any] | [number | string, any]
}

type EventAPI = {
  Event: typeof Event
  EventTarget: typeof EventTarget
}

type ChannelPubSubConfig = {
  /**
   * Event and EventTarget implementation.
   * Providing this is mandatory for a Node.js version below 14.
   */
  event?: EventAPI
}

const resolveGlobalConfig = (api: EventAPI = globalThis): EventAPI => {
  if (!api.Event || !api.EventTarget) {
    throw new Error(`
      [graphql-yoga] 'createChannelPubSub' uses the Event and EventTarget APIs.

In modern JavaScript environments those are part of the global scope. However, if you are using an older version of Node.js (<= 16.x.x), those APIs must be polyfilled.
You can provide polyfills to the 'createChannelPubSub' function:

\`\`\`
// yarn install @ungap/event @ungap/event-target
import Event from '@ungap/event'
import EventTarget from '@ungap/event-target'

const pubSub = createChannelPubSub({
  event: {
    Event,
    EventTarget,
  }
})
\`\`\`
`)
  }

  return globalThis
}

/**
 * Utility for publishing and subscribing to events.
 */
export const createChannelPubSub = <
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
>(
  config?: ChannelPubSubConfig,
) => {
  const { Event, EventTarget } = resolveGlobalConfig(config?.event)

  const target = new EventTarget()

  return {
    publish: <TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
      routingKey: TKey,
      ...args: TPubSubPublishArgsByKey[TKey]
    ) => {
      const event = new Event(routingKey)
      ;(event as any).data = args[0]
      target.dispatchEvent(event)
    },
    subscribe<TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
      ...[routingKey, id]: TPubSubPublishArgsByKey[TKey][1] extends undefined
        ? [TKey]
        : [TKey, TPubSubPublishArgsByKey[TKey][0]]
    ): AsyncGenerator<
      TPubSubPublishArgsByKey[TKey][1] extends undefined
        ? TPubSubPublishArgsByKey[TKey][0]
        : TPubSubPublishArgsByKey[TKey][1]
    > {
      const topic =
        id === undefined ? routingKey : `${routingKey}:${id as number}`

      const source = (async function* () {
        const pushQueue: Array<Event> = []
        const pullQueue: Array<(event: Event) => void> = []
        const handler = (event: Event) => {
          const nextResolve = pullQueue.shift()
          if (nextResolve) {
            nextResolve(event)
          } else {
            pushQueue.push(event)
          }
        }
        target.addEventListener(topic, handler)

        const pullValue = (): Promise<Event> =>
          new Promise((resolve) => {
            const nextEvent = pushQueue.shift()
            if (nextEvent) {
              resolve(nextEvent)
            } else {
              pullQueue.push(resolve)
            }
          })

        while (true) {
          const event = await pullValue()
          yield (event as any).data
        }
      })()

      return source
    },
  }
}
