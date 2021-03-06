/* eslint no-console: 0 */
import { EventEmitter } from 'fbemitter';

/**
 * Default regular emitter
 * @param {MessageEvent} e Original websocket event
 * @param {WsClientEvented} instance
 */
const defaultMessageHandler = (e, instance) => {
  const data = JSON.parse(e.data);
  const responseType = typeof data;

  if (responseType === 'object' && data.type) {
    instance.emitter.emit(data.type, e, data);
  }
};

/**
 * WSClientEvented - WebSocket Client with event emission
 * @author Weblogixx (cs@weblogixx.de)
 *
 * @example let wsClient = new WsClientEvented('ws://localhost:123', 'example-protocol', {
 *   autoOpen: false
 * });
 *
 * Available options:
 * bool autoOpen [default: true] Automatically connect the websocket on initialisation?
 * bool autoReconnect [default: true] Automatically reconnect the websocket if connection is lost?
 * bool debug [default: false] Show debug output?
 * bool forceCloseOnReload [default: false] Send a forced close on browser reload? Only available when using the client in the main thread!
 * int reconnectInterval [default: 1000] Delay in ms for reconnect tries
 * float reconnectDecay [default 1.5] Factor for reconnects
 * int timeoutInterval [default: 2000] Time in ms to wait for connects
 * string binaryType [default: blob] Binary type for websocket transmission
 * string payloadItemName [default: payload] Send key for send items
 * int maxReconnects [default: null] Maximal amount of reconnects. Set to null for inifinite
 * int maxReconnectTimeout [default: 5000] Maximal amount of milliseconds to wait for reconnects
 * int maxSendTries [default: 10] Maximal amount of tries for ws send to fail for the same request
 * function onBeforeWsOpen [default: null] Called before WebSocket connections are established
 * function onWsOpen [default: null] Called when a WebSocket connection becomes ready
 * function onWsMessage [default: defaultMessageHandler] Called on all WebSocket onMessage events. Defaults to emitting via fbemitter
 * function onWsClose [default: null] Called when a WebSocket connection is closed
 * function onWsError [default: null] Called when a WebSocket connection throws errors
 * function onMaxReconnects [default: null] Called when the maximal amount of reconnects is reached
 * function onWsTimeout [default: null] Called when a WebSocket connection times out
 */
export default class WsClientEvented {

  /**
   * Create a new instance of WsClientEvent
   * @param {String} url Url to connect to
   * @param {String|Array} protocols List of protocols [optional]
   * @param {Object} options Options to pass in [optional]
   */
  constructor(url, protocols = '', options = {}) {

    // Instanciate a new event emitter
    this.emitter = new EventEmitter();

    this.url = url;
    this.protocols = protocols && protocols.length > 0 ? protocols : null;

    // How often did the websocket retry to connect?
    this.reconnectAttempts = 0;

    // Set to true to indicate no reconnect should take place
    this.forcedClose = false;

    // The websocket instance
    this.ws = null;

    // List of tries for each send request
    this.sendTries = {};

    // Default settings
    this.settings = {
      autoOpen: true,
      autoReconnect: true,
      debug: false,
      forceCloseOnReload: false,
      reconnectInterval: 1000,
      reconnectDecay: 1.5,
      timeoutInterval: 2000,
      binaryType: 'blob',
      payloadItemName: 'payload',
      maxReconnects: null,
      maxSendTries: 10,
      maxReconnectTimeout: 5000,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: defaultMessageHandler.bind(this),
      onWsClose: null,
      onWsError: null,
      onMaxReconnects: null,
      onWsTimeout: null,
    };

    // Merge settings with defaults
    Object.keys(options).forEach((option) => {
      this.settings[option] = options[option];
    });

    // Attach all active listeners
    ['onBeforeWsOpen', 'onWsOpen', 'onWsMessage', 'onWsClose', 'onWsError', 'onMaxReconnects', 'onWsTimeout'].forEach((userEvt) => {
      if (typeof this.settings[userEvt] === 'function') {
        this.emitter.addListener(userEvt, (evt) => {
          this.settings[userEvt](evt, this);
        });
      }
    });

    if (this.settings.autoOpen) {
      this.open();
    }

    if (this.settings.forceCloseOnReload) {
      self.addEventListener('beforeunload', () => {
        this.close();
      });
    }
  }

  /**
   * Output debug information (only if debug setting enabled)
   * @param  {String} msg Message to output
   */
  debug(msg) {
    if (this.settings.debug) {
      console.warn(msg);
    }
  }

  /**
   * Add a new event listener
   * @param {String} evt Name of the event
   * @param {Function} callback Function to attach
   * @return {WsClientEvented}
   */
  addListener(evt, callback) {
    this.emitter.addListener(evt, callback);
    return this;
  }

  /**
   * Removes all listeners with a given name
   * @param  {String} evt
   * @return {WsClientEvented}
   */
  removeListener(evt) {
    this.emitter.removeAllListeners(evt);
    return this;
  }

  /**
   * Send a new request
   * @param  {String} event Event to send
   * @param  {Object|String} payload Data to send as payload [optional]
   * @return {WsClientEvent}
   */
  send(type, payload = {}) {

    // Skip if type is not given
    if (!type) {
      throw new Error(`Must provide an event type, provided: ${type}`);
    }

    // Only send if the connection is available.
    if (!this.ws) {
      if (this.settings.autoReconnect) {
        this.open();
      } else {
        this.debug(`Tried to send event ${type}, but forced close was set. Please open the connection manually via #open!`);
        return this;
      }
    }

    // Add the item to the send try list
    if (typeof this.sendTries[type] === 'undefined') {
      this.sendTries[type] = 1;
    }

    this.debug(`Trying to send event ${type} for the ${this.sendTries[type]} time...`);

    switch (this.ws.readyState) {

      // If the socket is in connecting state, try it again in a couple of ms
      case WebSocket.CONNECTING:

        // Skip trying to send the request if we reached the maximum
        if (this.sendTries[type] >= this.settings.maxSendTries) {
          this.debug(`WS still in connecting state, giving up after ${this.settings.maxSendTries} tries for event ${type}`);
          return this;
        }

        this.sendTries[type] += 1;
        self.setTimeout(() => {
          this.send(type, payload);
        }, 500);
        break;

      // If the socket is getting closed or is closed, reopen it
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:

        // Skip trying to send the request if we reached the maximum
        if (this.sendTries[type] >= this.settings.maxSendTries) {
          this.debug(`WS still in closing state, giving up after ${this.settings.maxSendTries} tries for event ${type}`);
          return this;
        }

        this.sendTries[type] += 1;
        this.open(true);
        self.setTimeout(() => {
          this.send(type, payload);
        }, 500);
        break;

      // If the websocket is open, just send
      case WebSocket.OPEN:
      default:

        this.ws.send(JSON.stringify({
          type,
          [this.settings.payloadItemName]: payload,
        }));

        // Request went through, reset the try counter
        this.sendTries[type] = 1;
    }

    return this;
  }

  /**
   * Open the websocket
   * @param {Boolean} reconnecting Status of the connection (true if a forced reconnect was done)
   * @return {WsClientEvent}
   */
  open(reconnecting = false) {

    // If the maximal amounts of reconnects is hit, just exit
    if (this.settings.maxReconnects && this.reconnectAttempts >= this.settings.maxReconnects) {
      this.debug('Maximal amount of reconnects reached, giving up! Please call #open by yourself to retry.');
      this.emitter.emit('onMaxReconnects');
      return this;
    }

    // Close the websocket if it is already open
    if (!reconnecting && this.ws) {
      this.close();
    }

    this.emitter.emit('onBeforeWsOpen');

    // Automatically disconnect after a given period of time
    const connectTimeOut = setTimeout(() => {
      this.debug('WS Connection timed out');
      this.emitter.emit('onWsTimeout');
    }, this.settings.timeoutInterval);

    // Create the new websocket instance
    this.ws = new WebSocket(this.url, this.protocols);
    this.ws.binaryType = this.settings.binaryType;

    // Add the needed events
    this.ws.addEventListener('open', (e) => {

      // Clean up the connect timeout after open was fired
      clearTimeout(connectTimeOut);

      this.emitter.emit('onWsOpen', e, this);

      this.debug(`WS connection successfully opened on attemp#${this.reconnectAttempts}.`);

      // We are connected, so reset the reconnect attempts
      this.reconnectAttempts = 0;

      // Reset the send queue
      this.sendTries = {};
    });

    this.ws.addEventListener('message', (e) => {
      this.emitter.emit('onWsMessage', e, this);
    });

    this.ws.addEventListener('close', (e) => {

      clearTimeout(connectTimeOut);

      this.emitter.emit('onWsClose', e, this);

      // Try to reconnect if the close action was not forced via WsClientEvented#close
      if (!this.forcedClose && this.settings.autoReconnect) {

        // Reconnect the websocket automatically
        // @credits: https://github.com/joewalnes/reconnecting-websocket/
        let timeout = this.settings.reconnectInterval * Math.pow(this.settings.reconnectDecay, this.reconnectAttempts);
        if (timeout > this.settings.maxReconnectTimeout) {
          timeout = this.settings.maxReconnectTimeout;
        }
        this.debug(`Auto reconnect required, trying again in ${timeout} ms...`);

        setTimeout(() => {
          this.reconnectAttempts += 1;
          this.open(true);
          this.debug('WS connection timed out, trying to reconnect...');
        }, timeout);
      } else if (this.forcedClose) {
        this.forcedClose = false;
        this.debug('WS forced closing the connection');
      }
    });

    this.ws.addEventListener('error', (e) => {
      this.emitter.emit('onWsError', e, this);
    });

    return this;
  }

  /**
   * Close the websocket if it is open
   * @param  {Number} code The code to send [optional]
   * @param  {String} reason The reason for closing [optional]
   * @return {WsClientEvent}
   */
  close(code = 1000, reason = '') {
    if (this.ws) {
      this.forcedClose = true;
      this.reconnectAttempts = 0;
      this.sendTries = {};
      this.ws.close(code, reason);
      this.ws = null;
    }
    return this;
  }
}
