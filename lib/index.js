import EventEmitter from 'wolfy87-eventemitter';

class WsClientEvent {

  /**
   * Create a new instance of WsClientEvent
   * @param  {String} url Url to connect to
   * @param  {String|Array} protocols List of protocols [optional]
   * @param  {Object} options Options to pass in [optional]
   */
  constructor(url, protocols=[], options={}) {

    // Instanciate a new event emitter
    this.emitter = new EventEmitter();

    this.url = url;
    this.protocols = protocols.length > 0 ? protocols : '';

    // The websocket instance
    this.ws = null;

    // Default settings
    this.settings = {
      debug: false,
      autoOpen: true,
      binaryType: 'blob'
    };

    // Merge settings with defaults
    for(let key in options) {
      this.settings[key] = options[key];
    }

    // Attach needed events
    this.emitter.addListener('onBeforeWsOpen', (e) => {
      console.log('onBeforeWsOpen');
      console.log(e);
    });

    this.emitter.addListener('onWsOpen', (e) => {
      console.log('onWsOpen');
      console.log(e);
    });

    this.emitter.addListener('onWsMessage', (e) => {
      console.log('onWsMessage');
      console.log(e);
    });

    this.emitter.addListener('onWsClose', (e) => {
      console.log('onWsClose');
      console.log(e);
    });

    this.emitter.addListener('onWsError', (e) => {
      console.log('onWsError');
      console.log(e);
    });
  }

  /**
   * Open the websocket
   * @return {WsClientEvent}
   */
  open() {

    // Close the websocket if it is already open
    if(this.ws) {
      this.ws.close();
    }

    this.emitter.emitEvent('onBeforeWsOpen');

    // Create the new websocket instance
    this.ws = new WebSocket(this.url, this.protocols);
    this.ws.binaryType = this.binaryType;

    // Set the needed events for the websocket
    this.ws.addEventListener('open', (e) => {
      this.emitter.emitEvent('onWsOpen', e);
    });

    this.ws.addEventListener('message', (e) => {
      this.emitter.emitEvent('onWsMessage', e);
    });

    this.ws.addEventListener('close', (e) => {
      this.emitter.emitEvent('onWsClose', e);
    });

    this.ws.addEventListener('error', (e) => {
      this.emitter.emitEvent('onWsError', e);
    });

    return this;
  }
}

export default WsClientEvent;
