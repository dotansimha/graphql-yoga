export type TypedEvent = Event & {
  data?: unknown
}

export interface TypedEventListener<TEvent extends TypedEvent>
  extends EventListener {
  (evt: TEvent): void
}

export interface TypedEventListenerObject<TEvent extends TypedEvent>
  extends EventListener {
  handleEvent(object: TEvent): void
}

export type TypedEventListenerOrEventListenerObject<TEvent extends TypedEvent> =
  TypedEventListener<TEvent> | TypedEventListenerObject<TEvent>

export interface TypedEventTarget<TEvent extends TypedEvent>
  extends EventTarget {
  addEventListener(
    type: string,
    callback: TypedEventListenerOrEventListenerObject<TEvent>,
    options?: AddEventListenerOptions | boolean,
  ): void
  dispatchEvent(event: TEvent): boolean
  removeEventListener(
    type: string,
    callback: TypedEventListenerOrEventListenerObject<TEvent>,
    options?: EventListenerOptions | boolean,
  ): void
}

export type EventAPI = {
  Event: typeof Event
  EventTarget: typeof EventTarget
}

export const resolveGlobalConfig = (api: EventAPI = globalThis): EventAPI => {
  if (!api.Event || !api.EventTarget) {
    throw new Error(`
[@graphql-yoga/subscription] 'createPubSub' uses the Event and EventTarget APIs.

In modern JavaScript environments those are part of the global scope. However, if you are using an older version of Node.js (< 16.x.x), those APIs must be polyfilled.
You can provide polyfills to the 'createPubSub' function:

\`\`\`
// yarn install --exact event-target-polyfill@0.0.3
import 'event-target-polyfill'

const pubSub = createPubSub()
\`\`\`

Alternatively, you can provide your own custom implementation.

\`\`\`
const pubSub = createPubSub({
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
