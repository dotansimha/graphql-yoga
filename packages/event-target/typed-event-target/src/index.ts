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
  /**
   * If the return value is a promise, the promise will resolve once the event listener has been set up.
   */
  addEventListener(
    type: string,
    callback: TypedEventListenerOrEventListenerObject<TEvent> | null,
    options?: AddEventListenerOptions | boolean,
  ): void | Promise<void>;
  dispatchEvent(event: TEvent): boolean;
  removeEventListener(
    type: string,
    callback: TypedEventListenerOrEventListenerObject<TEvent> | null,
    options?: EventListenerOptions | boolean,
  ): void;
}
