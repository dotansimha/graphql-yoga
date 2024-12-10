export interface TypedEventListener<TEvent extends CustomEvent> {
  (evt: TEvent): void;
}

export interface TypedEventListenerObject<TEvent extends CustomEvent> {
  handleEvent(object: TEvent): void;
}

export type TypedEventListenerOrEventListenerObject<TEvent extends CustomEvent> =
  | TypedEventListener<TEvent>
  | TypedEventListenerObject<TEvent>;

export interface TypedEventTarget<TEvent extends CustomEvent> extends EventTarget {
  addEventListener<TCurrEvent extends TEvent, TEventType extends TCurrEvent['type']>(
    type: TEventType,
    callback: TypedEventListenerOrEventListenerObject<TCurrEvent> | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: TEvent): boolean;
  removeEventListener<TCurrEvent extends TEvent, TEventType extends TCurrEvent['type']>(
    type: TEventType,
    callback: TypedEventListenerOrEventListenerObject<TCurrEvent> | null,
    options?: EventListenerOptions | boolean,
  ): void;
}
