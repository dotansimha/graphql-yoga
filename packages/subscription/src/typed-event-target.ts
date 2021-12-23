// extends EventTarget types and adds typed Events

export interface TypedEventListener<TEvent extends Event>
  extends EventListener {
  (evt: TEvent): void
}

export interface TypedEventListenerObject<TEvent extends Event>
  extends EventListener {
  handleEvent(object: TEvent): void
}

export type TypedEventListenerOrEventListenerObject<TEvent extends Event> =
  | TypedEventListener<TEvent>
  | TypedEventListenerObject<TEvent>
  | null

export interface TypedEventTarget<TEvent extends Event> extends EventTarget {
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
