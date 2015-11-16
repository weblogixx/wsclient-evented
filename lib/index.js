import { EventEmitter } from 'fbemitter';

class WsClientEvent {

  /**
   * Create a new instance of WsClientEvent
   * @param  {String} url Url to connect to
   * @param  {String|Array} protocols List of protocols [optional]
   * @param  {Object} options Options to pass in [optional]
   */
  constructor(url, protocols='', options={}) {

    // Instanciate a new event emitter
    this.emitter = new EventEmitter();

    this.url = url;
    this.protocols = protocols.length > 0 ? protocols : '';

    // The current timeout
    this.timeout = null;

    // The websocket instance
    this.ws = null;

    // Default settings
    this.settings = {
      autoOpen: true,
      reconnectInterval: 250,
      binaryType: 'blob',
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

    // Handle objects
    this.emitter.addListener('onWsMessage', (e) => {
      let data = JSON.parse(e.data);
      let responseType = typeof data;

      if(responseType === 'object' && data.type) {
        this.emitter.emit(data.type, data, e);
      }
    });

    if(this.settings.autoOpen) {
      this.open();
    }
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
    if(!this.ws || this.ws.readyState !== WebSocket.OPEN) {

      this.open();
      window.setTimeout(() => {
        this.send(type, payload);
      }, 50);

      return this;
    }

    this.ws.send(JSON.stringify({
      type: type,
      payload: payload
    }));

    return this;
  }

  /**
   * Open the websocket
   * @return {WsClientEvent}
   */
  open() {

    // Close the websocket if it is already open
    if(this.ws) {
      this.close();
    }

    this.emitter.emit('onBeforeWsOpen');

    // Create the new websocket instance
    this.ws = new WebSocket(this.url, this.protocols);
    this.ws.binaryType = this.settings.binaryType;

    // Add the needed events
    this.ws.addEventListener('open', (e) => {
      this.emitter.emit('onWsOpen', e, this);
    });

    this.ws.addEventListener('message', (e) => {
      this.emitter.emit('onWsMessage', e, this);
    });

    this.ws.addEventListener('close', (e) => {
      this.emitter.emit('onWsClose', e, this);
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
      this.ws.close(code, reason);
      this.ws = null;
    }
    return this;
  }
}

export default WsClientEvent;
