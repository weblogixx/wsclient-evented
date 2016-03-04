# wsclient-evented
> A (very) simple WebSocket client wrapper written in ES2015, coupled with an event emitter.

## Why should I use it?
wsclient-evented is just an easy wrapper for the native WebSocket client.
It adds some often needed functionality like

- [x] Relative small in size (8.5kb minified)
- [x] Automatic reconnects when connections get closed
- [x] Send method automatically opens the connection if it is closed
- [x] Possibility to listen for any server events without big switch statements in onMessage via facebooks fbemitter
- [x] Automatically parsing of payload data
- [x] Cross browser compatible* (at least with all browsers that support WebSockets :))

## Missing features
- [ ] Binary data support has not been tested

## Compatibility
- [x] Google Chrome
- [x] Apple Safari
- [x] Mozilla Firefox
- [x] Microsoft Edge
- [x] Microsoft Internet Explorer (10, 11)

## Installation
There are two possibilities to use the client:

#### Old school:
Just add the file dist/browser.js into your url to make window.WsClientEvented available.

Example:
```html
<script src="wsclient-evented/dist/browser.js"></script>
<script>
var wsClient = new WsClientEvented('ws://url');
wsClient.send('x');
</script>
```

#### ES2015 import
If you are using webpack or native ES2015 imports, you may use the client like this:

```javascript
import WsClient from 'wsclient-evented';
let wsClient = new WsClient('ws://url');
wsClient.send('x');
```

### Examples
You can see a working example in ```lib/index.html```.
This example connects to a node.js WebSocket server that is configured to listen for the configured message format. Just use ```npm run test:watch``` to see the connect and event firing happen via your favorite webdeveloper console tool.

### Usage
The constructor expects the following arguments:

#### url (String, required):
The url to connect to as defined in the ws protocol (type://host:port). This must always be provided.

#### protocols (String, Array or null, optional):
One or more protocols to use as described in the WebSocket spec. Automatically set to ```null``` if no protocol should be used.

#### options (Object, optional):
Key/Value option object, used to override the default settings.
wsclient-evented can be configured with an options array on initialisation.
Provided options will automatically override the defaults shown below.
The following options are available:

```javascript
bool autoOpen [default: true] Automatically connect the WebSocket on initialisation?
bool autoReconnect [default: true] Automatically reconnect the WebSocket if connection is lost?
bool forceCloseOnReload [default: false] Send a forced close on browser reload?
bool debug [default: false] Show debug output?
int reconnectInterval [default: 1000] Delay in ms for reconnect tries
float reconnectDecay [default 1.5] Factor for reconnects
int timeoutInterval [default: 2000] Time in ms to wait for connects
string binaryType [default: blob] Binary type for websocket transmission
string payloadItemName [default: "payload"] The name of the payload key, used for send
int maxReconnects [default: null] Maximal amount of reconnects. Set to null for inifinite
int maxReconnectTimeout [default: 5000] Maximal amount of milliseconds to wait for reconnects
int maxSendTries [default: 10] Maximal amount of tries for ws send to fail for the same request
function onBeforeWsOpen [default: null] Called before WebSocket connections are established
function onWsOpen [default: null] Called when a WebSocket connection becomes ready
function onWsMessage [default: null] Called on all WebSocket onMessage events
function onWsClose [default: null] Called when a WebSocket connection is closed
function onWsError [default: null] Called when a WebSocket connection throws errors
function onWsTimeout [default: null] Called when a WebSocket connection times out
```

### Methods
The following methods are available for usage after a new wsclient-evented was created.

#### addListener(string evt, function callBack):
Adds an event listener for event ```evt``` that will trigger the callback ```callBack```.
Events registered this way will fire when a message with the given type was received via the WebSocket.

```javascript
// assuming ws is a valid wsclient-evented instance and test-response is an event that got send from the server
ws.addListener('test-response', function(eventType, wsEvent, data) {
  console.log('got new event of type ' + eventType);
  console.log('original websocket event: ', wsEvent);
  console.log('received data: ', data);
});
```

#### removeListener(string evt):
Removes all events named ```evt``` from the WebSockets onMessage listener.

#### send(string type, object payload[optional]):
Sends a message of type ```type``` with a payload of ```payload```.
Payload may be any json serializeable object or omitted to send an empty message.
This method will automatically try to reconnect the WebSocket if it is not connected before sending.
The amount of send tries can be configured via ```options.maxSendTries```.

##### wsclient-evented websocket message format:
The client sends a special format when using text type messages.
It is currently defined like this:
```javascript
{
  type: type,
  payload: payload
}
```

This format will get stringified before sending and ***must*** therefore be translated on the server. Server events, must send data in the same way!
See ```karma.conf.js``` for an example how to do this.

```javascript
// ... snip
connection.on('message', (msg) => {

  if(msg.type === 'utf8') {

    let payload = JSON.parse(msg.utf8Data);

    switch(typeof payload) {
      case 'string':
        connection.sendUTF(JSON.stringify(`${payload} - response`));
        break;

      case 'object':
      default:
        connection.sendUTF(JSON.stringify({
          type: `${payload.type}-response`,
          payload: payload.payload
        }));
    }
  }
});
// ... snip
```

#### open(bool reconnecting[optional]):
The open function will open a new WebSocket connection to the specified host.
It also sets up listeners for opening/closing and timeouts.
Automatically called when ```options.autoOpen``` is set to true (the default).
The flag reconnecting indicates a automatic reconnection attempt if the WebSocket closes unexpectedly.

#### close(int code[optional], string reason[optional]):
Closes the WebSocket. Will also make sure the socket does not automatically reconnect if ```options.autoReconnect``` is set to true (the default).
After closing the WebSocket, you will have to manually call wsclient-evented#open to connect the socket again.

### Special thanks
This client would not have been possible without the work of [Joe Walnes](https://github.com/joewalnes) who build [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket). Check out this project if you need a much lighter, lower level version of what I try to accomplish.

### Licence
[MIT license](http://opensource.org/licenses/MIT)
