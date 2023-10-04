import type { Cluster, Redis } from 'ioredis';
import type { TypedEventTarget } from '@graphql-yoga/typed-event-target';
import { CustomEvent } from '@whatwg-node/events';

export type CreateRedisEventTargetArgs = {
  publishClient: Redis | Cluster;
  subscribeClient: Redis | Cluster;
  serializer?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stringify: (message: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parse: (message: string) => any;
  };
};

export function createRedisEventTarget<TEvent extends CustomEvent>(
  args: CreateRedisEventTargetArgs,
): TypedEventTarget<TEvent> {
  const { publishClient, subscribeClient } = args;

  const serializer = args.serializer ?? JSON;

  const callbacksForTopic = new Map<string, Set<(event: TEvent) => void>>();

  function onMessage(channel: string, message: string) {
    const callbacks = callbacksForTopic.get(channel);
    if (callbacks === undefined) {
      return;
    }

    const event = new CustomEvent(channel, {
      detail: message === '' ? null : serializer.parse(message),
    }) as TEvent;
    for (const callback of callbacks) {
      callback(event);
    }
  }

  subscribeClient.on('message', onMessage);

  function addCallback(topic: string, callback: (event: TEvent) => void) {
    let callbacks = callbacksForTopic.get(topic);
    if (callbacks === undefined) {
      callbacks = new Set();
      callbacksForTopic.set(topic, callbacks);

      subscribeClient.subscribe(topic);
    }
    callbacks.add(callback);
  }

  function removeCallback(topic: string, callback: (event: TEvent) => void) {
    const callbacks = callbacksForTopic.get(topic);
    if (callbacks === undefined) {
      return;
    }
    callbacks.delete(callback);
    if (callbacks.size > 0) {
      return;
    }
    callbacksForTopic.delete(topic);
    subscribeClient.unsubscribe(topic);
  }

  return {
    addEventListener(topic, callbackOrOptions) {
      if (callbackOrOptions != null) {
        const callback =
          'handleEvent' in callbackOrOptions ? callbackOrOptions.handleEvent : callbackOrOptions;
        addCallback(topic, callback);
      }
    },
    dispatchEvent(event: TEvent) {
      publishClient.publish(
        event.type,
        event.detail === undefined ? '' : serializer.stringify(event.detail),
      );
      return true;
    },
    removeEventListener(topic, callbackOrOptions) {
      if (callbackOrOptions != null) {
        const callback =
          'handleEvent' in callbackOrOptions ? callbackOrOptions.handleEvent : callbackOrOptions;
        removeCallback(topic, callback);
      }
    },
  };
}
