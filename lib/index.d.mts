/** A registered listener. */
export interface EmitterSubscription {
  /** Name of the event. */
  eventType: string;
  /** The registered function. */
  listener: (...args: any[]) => void;
  /** Value of `this` for the listener. */
  context: unknown;
  /** Remove this listener. */
  remove(): void;
}

/** The event emitter behind a client, available as `client.emitter`. */
export interface WsEmitter {
  /** Add a listener for an event. */
  addListener(eventType: string, listener: (...args: any[]) => void, context?: unknown): EmitterSubscription;
  /** Add a listener that is removed after its first call. */
  once(eventType: string, listener: (...args: any[]) => void, context?: unknown): EmitterSubscription;
  /** Call all listeners of an event. */
  emit(eventType: string, ...args: any[]): void;
  /** Get the listener functions of an event. */
  listeners(eventType: string): Array<(...args: any[]) => void>;
  /** Remove all listeners of an event, or every listener if no event is given. */
  removeAllListeners(eventType?: string): void;
  /** Remove the listener that is currently being called. Throws outside of an emit. */
  removeCurrentListener(): void;
  /** Remove a single subscription. */
  removeSubscription(subscription: EmitterSubscription): void;
}

/** A callback for a connection event. */
export type WsCallback<TEvent> = ((event: TEvent, client: WsClientEvented) => void) | null;

/** A message in the format used by the default message handler. */
export interface WsMessage<TPayload = any> {
  type: string;
  payload?: TPayload;
  [key: string]: any;
}

export interface WsClientOptions {
  /** Connect when the client is created. Default: `true` */
  autoOpen?: boolean;
  /** Reconnect when the connection is lost. Default: `true` */
  autoReconnect?: boolean;
  /** Log debug output. Default: `false` */
  debug?: boolean;
  /** Close the connection on page unload. Main thread only. Default: `false` */
  forceCloseOnReload?: boolean;
  /** Delay in ms before the first reconnect. Default: `1000` */
  reconnectInterval?: number;
  /** Factor applied to the delay on every further reconnect. Default: `1.5` */
  reconnectDecay?: number;
  /** Time in ms before `onWsTimeout` fires for a pending connection. Default: `2000` */
  timeoutInterval?: number;
  /** Binary type of the WebSocket. Default: `'blob'` */
  binaryType?: BinaryType;
  /** Key of the payload in sent messages. Default: `'payload'` */
  payloadItemName?: string;
  /** Maximum number of reconnects, `null` for unlimited. Default: `null` */
  maxReconnects?: number | null;
  /** Maximum reconnect delay in ms. Default: `5000` */
  maxReconnectTimeout?: number;
  /** Maximum number of tries for sending a message. Default: `10` */
  maxSendTries?: number;
  /** Called before a connection is opened. */
  onBeforeWsOpen?: WsCallback<undefined>;
  /** Called when a connection is ready. */
  onWsOpen?: WsCallback<Event>;
  /** Replaces the default message handler. */
  onWsMessage?: WsCallback<MessageEvent>;
  /** Called when a connection is closed. */
  onWsClose?: WsCallback<CloseEvent>;
  /** Called when a connection fails. */
  onWsError?: WsCallback<Event>;
  /** Called when `maxReconnects` is reached. */
  onMaxReconnects?: WsCallback<undefined>;
  /** Called when a connection attempt takes longer than `timeoutInterval`. */
  onWsTimeout?: WsCallback<undefined>;
}

/** WebSocket client with automatic reconnects and events for server messages. */
export default class WsClientEvented {
  /**
   * @param url URL to connect to
   * @param protocols One or more subprotocols. Empty or `null` requests none.
   * @param options Overrides for the default settings
   */
  constructor(url: string, protocols?: string | string[] | null, options?: WsClientOptions);

  /** The event emitter of this client. */
  emitter: WsEmitter;
  url: string;
  protocols: string | string[] | null;
  /** Number of reconnect attempts since the last successful connection. */
  reconnectAttempts: number;
  /** `true` while a close requested via `close()` is in progress. */
  forcedClose: boolean;
  /** The current WebSocket, `null` when closed via `close()`. */
  ws: WebSocket | null;
  /** Number of send tries per message type. */
  sendTries: Record<string, number>;
  /** The active settings. */
  settings: Required<WsClientOptions>;

  /** Log a message if the `debug` setting is on. */
  debug(msg: string): void;

  /**
   * Listen for a message type. With the default message handler the callback receives the
   * original event and the parsed message.
   */
  addListener<TMessage = WsMessage, TEvent = MessageEvent>(
    evt: string,
    callback: (event: TEvent, message: TMessage) => void,
  ): this;

  /** Remove all listeners of a message type. */
  removeListener(evt: string): this;

  /** Send a message. Opens the connection first if needed. */
  send(type: string, payload?: unknown): this;

  /**
   * Open the connection.
   * @param reconnecting Keep the current socket instead of closing it first
   */
  open(reconnecting?: boolean): this;

  /** Close the connection. Call `open()` to connect again. */
  close(code?: number, reason?: string): this;
}
