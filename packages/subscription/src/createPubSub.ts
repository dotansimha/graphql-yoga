import { Repeater } from '@repeaterjs/repeater'
import type {
  TypedEventTarget,
  EventAPI,
} from '@graphql-yoga/typed-event-target'

type PubSubPublishArgsByKey = {
  [key: string]: [] | [any] | [number | string, any]
}

export type PubSubEvent<
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
  TKey extends Extract<keyof TPubSubPublishArgsByKey, string>,
> = Event & {
  data?: TPubSubPublishArgsByKey[TKey][1] extends undefined
    ? TPubSubPublishArgsByKey[TKey][0]
    : TPubSubPublishArgsByKey[TKey][1]
}

export type PubSubEventTarget<
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
> = TypedEventTarget<
  PubSubEvent<
    TPubSubPublishArgsByKey,
    Extract<keyof TPubSubPublishArgsByKey, string>
  >
>

export type ChannelPubSubConfig<
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
> = {
  /**
   * The event target. If not specified an (in-memory) EventTarget will be created.
   * For multiple server replica or serverless environments a distributed EventTarget is recommended.
   *
   * An event dispatched on the event target MUST have a `data` property.
   */
  eventTarget?: PubSubEventTarget<TPubSubPublishArgsByKey>
  /**
   * Event and EventTarget implementation.
   * Providing this is mandatory for a Node.js versions below 16.
   */
  event?: EventAPI
}

export type PubSub<TPubSubPublishArgsByKey extends PubSubPublishArgsByKey> = {
  /**
   * Publish a value for a given topic.
   */
  publish<TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
    routingKey: TKey,
    ...args: TPubSubPublishArgsByKey[TKey]
  ): void
  /**
   * Subscribe to a topic.
   */
  subscribe<TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
    ...[routingKey, id]: TPubSubPublishArgsByKey[TKey][1] extends undefined
      ? [TKey]
      : [TKey, TPubSubPublishArgsByKey[TKey][0]]
  ): Repeater<
    TPubSubPublishArgsByKey[TKey][1] extends undefined
      ? TPubSubPublishArgsByKey[TKey][0]
      : TPubSubPublishArgsByKey[TKey][1]
  >
}

/**
 * Utility for publishing and subscribing to events.
 */
export const createPubSub = <
  TPubSubPublishArgsByKey extends PubSubPublishArgsByKey,
>(
  config?: ChannelPubSubConfig<TPubSubPublishArgsByKey>,
): PubSub<TPubSubPublishArgsByKey> => {
  const target = config?.eventTarget ?? new EventTarget()

  return {
    publish<TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
      routingKey: TKey,
      ...args: TPubSubPublishArgsByKey[TKey]
    ) {
      const payload = args[1] ?? args[0]
      const topic =
        args[1] === undefined
          ? routingKey
          : `${routingKey}:${args[0] as number}`

      const event: PubSubEvent<TPubSubPublishArgsByKey, TKey> = new Event(topic)
      event.data = payload
      target.dispatchEvent(event)
    },
    subscribe<TKey extends Extract<keyof TPubSubPublishArgsByKey, string>>(
      ...[routingKey, id]: TPubSubPublishArgsByKey[TKey][1] extends undefined
        ? [TKey]
        : [TKey, TPubSubPublishArgsByKey[TKey][0]]
    ): Repeater<
      TPubSubPublishArgsByKey[TKey][1] extends undefined
        ? TPubSubPublishArgsByKey[TKey][0]
        : TPubSubPublishArgsByKey[TKey][1]
    > {
      const topic =
        id === undefined ? routingKey : `${routingKey}:${id as number}`

      return new Repeater(function subscriptionRepeater(next, stop) {
        stop.then(function subscriptionRepeaterStopHandler() {
          target.removeEventListener(topic, pubsubEventListener)
        })

        target.addEventListener(topic, pubsubEventListener)

        function pubsubEventListener(
          event: PubSubEvent<TPubSubPublishArgsByKey, TKey>,
        ) {
          next(event.data)
        }
      })
    },
  }
}
