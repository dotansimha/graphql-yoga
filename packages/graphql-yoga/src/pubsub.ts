import EventTarget from '@ungap/event-target'
import Event from '@ungap/event'

type PubSubPublishArgsByKey = {
  [key: string]: [any] | [number | string, any]
}

/**
 * Utility for publishing and subscribing to events.
 */
export const createChannelPubSub = <
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
>() => {
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
    subscribe: async function* <
      TKey extends Extract<keyof TPubSubPublishArgsByKey, string>,
    >(
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
    },
  }
}
