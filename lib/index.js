import { EventEmitter } from 'fbemitter';

class WsClientEvented {

  /**
   * Create a new instance of WsClientEvent
   * @param {String} url Url to connect to
   * @param {String|Array} protocols List of protocols [optional]
   * @param {Object} options Options to pass in [optional]
   */
  constructor(url, protocols='', options={}) {

    // Instanciate a new event emitter
    this.emitter = new EventEmitter();

    this.url = url;
    this.protocols = protocols.length > 0 ? protocols : '';

    // How often did the websocket retry to connect?
    this.reconnectAttempts = 0;

    // The current timeout
    this.timeout = null;

    // Set to true to indicate no reconnect should take place
    this.forcedClose = false;

    // The websocket instance
    this.ws = null;

    // Default settings
    this.settings = {
      autoOpen: true,
      autoReconnect: true,
      reconnectInterval: 250,
      binaryType: 'blob',
      maxReconnects: null,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: null,
      onWsClose: null,
      onWsError: null
    };

    // Merge settings with defaults
    for(let key in options) {
      this.settings[key] = options[key];
    }

    // Attach all active listeners
    for(let e of [ 'onBeforeWsOpen', 'onWsOpen', 'onWsMessage', 'onWsClose', 'onWsError' ]) {
      if(typeof this.settings[e] === 'function') {
        this.emitter.addListener(e, (evt) => {
          this.settings[e](evt, this);
        });
      }
    }

    // Handle websocket requests that come back in the required format.
    // @todo: Add support for binary
    this.emitter.addListener('onWsMessage', (e) => {
      let data = JSON.parse(e.data);
      let responseType = typeof data;

      if(responseType === 'object' && data.type) {
        this.emitter.emit(data.type, e, data);
      }
    });

    if(this.settings.autoOpen) {
      this.open();
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
   * @param  {Object|String} payload Data to send as payload
   * @return {WsClientEvent}
   */
  send(type, payload) {

    // Skip if type or payload are not given
    if(!type || !payload) {
      throw `Must provide type and payload, provided: ${type}, ${payload}`;
    }

    // Only send if the connection is available!
    if(!this.ws) {
      return this;
    }

    switch(this.ws.readyState) {

      // If the socket is in connecting state, try it again in a couple of ms
      case WebSocket.CONNECTING:
        window.setTimeout(() => {
          this.send(type, payload);
        }, 5);
        break;

      // If the socket is getting closed or is closed, reopen it
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        this.open();
        window.setTimeout(() => {
          this.send(type, payload);
        }, 5);
        break;

      // If the websocket is open, just send
      case WebSocket.OPEN:
      default:
        this.ws.send(JSON.stringify({
          type: type,
          payload: payload
        }));
    }

    return this;
  }

  /**
   * Open the websocket
   * @param {Boolean} reconnecting Status of the connection (true if a forced reconnect was done)
   * @return {WsClientEvent}
   */
  open(reconnecting=false) {

    // If the maximal amounts of reconnects is hit, just exit
    if(this.settings.maxReconnects && this.reconnectAttempts >= this.settings.maxReconnects) {
      return this;
    }

    // Close the websocket if it is already open
    if(!reconnecting && this.ws) {
      this.close();
    }

    this.emitter.emit('onBeforeWsOpen');

    // Create the new websocket instance
    this.ws = new WebSocket(this.url, this.protocols);
    this.ws.binaryType = this.settings.binaryType;

    // Add the needed events
    this.ws.addEventListener('open', (e) => {
      this.emitter.emit('onWsOpen', e, this);

      // We are connected, so reset the reconnect attempts
      this.reconnectAttempts = 0;
    });

    this.ws.addEventListener('message', (e) => {
      this.emitter.emit('onWsMessage', e, this);
    });

    this.ws.addEventListener('close', (e) => {
      this.emitter.emit('onWsClose', e, this);

      // Reconnect the websocket automatically if it should
      if(!this.forcedClose && this.settings.autoReconnect) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.open(true);
        }, 50);
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
  close(code=1000, reason='') {
    if(this.ws) {
      this.forcedClose = true;
      this.ws.close(code, reason);
      this.ws = null;
    }
    return this;
  }
}

export default WsClientEvented;
