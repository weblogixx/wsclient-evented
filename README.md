# wsclient-evented

A small WebSocket client with automatic reconnects and events for server messages.
No runtime dependencies, about 7 kB minified.

The native `WebSocket` gives you a connection and not much else. This wrapper adds the parts you end up writing yourself:

- Automatic reconnects with exponential backoff
- Sending opens the connection first if needed, and retries while it connects
- One listener per message type instead of a big `switch` in `onmessage`
- JSON encoding and decoding of messages
- Callbacks for the whole connection lifecycle
- TypeScript types included

## Installation

```bash
npm install wsclient-evented
```

The package ships modern ES modules, so use it with a bundler or in Node.js 22 or newer, which has a native `WebSocket`.

For a plain `<script>` tag, use the prebuilt ES5 bundle. It provides a global `WsClientEvented`:

```html
<script src="https://unpkg.com/wsclient-evented/dist/wsclientevented.js"></script>
```

## Quick start

```javascript
import WsClient from 'wsclient-evented';

const client = new WsClient('wss://example.com/socket');

// Called for every message of type "chat-message"
client.addListener('chat-message', (event, message) => {
  console.log(message.payload.text);
});

// Safe to call right away, the client waits for the connection
client.send('join-room', { room: 'general' });
```

## Message format

Messages are JSON objects with a `type` and a `payload`, in both directions:

```json
{
  "type": "chat-message",
  "payload": { "text": "Hello!" }
}
```

Your server has to use this format, unless you [bring your own message handler](#custom-message-handler). The name of the payload key for sent messages can be changed with `payloadItemName`.

A minimal server using [ws](https://github.com/websockets/ws):

```javascript
import { WebSocketServer } from 'ws';

new WebSocketServer({ port: 8080 }).on('connection', (socket) => {
  socket.on('message', (raw) => {
    const { type, payload } = JSON.parse(raw.toString());

    socket.send(JSON.stringify({
      type: `${type}-response`,
      payload,
    }));
  });
});
```

## Examples

### Show the connection state

```javascript
const client = new WsClient('wss://example.com/socket', null, {
  onBeforeWsOpen: () => setStatus('connecting'),
  onWsOpen: () => setStatus('online'),
  onWsClose: () => setStatus('offline'),
  onMaxReconnects: () => setStatus('failed'),
  maxReconnects: 10,
});
```

### Use a subprotocol

```javascript
const client = new WsClient('wss://example.com/socket', 'chat-v2');
```

### Connect later

```javascript
const client = new WsClient('wss://example.com/socket', null, {
  autoOpen: false,
});

client.addListener('welcome', (event, { payload }) => {
  console.log(payload);
});

client.open();
```

### Tune reconnects

The delay is `reconnectInterval * reconnectDecay ^ attempts`, capped at `maxReconnectTimeout`. With these settings the client waits 0.5, 1, 2, 4 and then 5 seconds:

```javascript
const client = new WsClient('wss://example.com/socket', null, {
  reconnectInterval: 500,
  reconnectDecay: 2,
  maxReconnectTimeout: 5000,
});
```

### Forward messages to a store

```javascript
client.addListener('new-data', (event, { payload }) => {
  store.dispatch({ type: 'RECEIVED_DATA', data: payload });
});
```

### Custom message handler

`onWsMessage` replaces the default handler, for example if your server uses a different format:

```javascript
const client = new WsClient('wss://example.com/socket', null, {
  onWsMessage: (event, instance) => {
    const { name, body } = JSON.parse(event.data);
    instance.emitter.emit(name, event, body);
  },
});

client.addListener('update', (event, body) => {
  console.log(body);
});
```

### TypeScript

Listeners can declare the message they expect:

```typescript
import WsClient, { type WsMessage } from 'wsclient-evented';

const client = new WsClient('wss://example.com/socket');

client.addListener<WsMessage<{ text: string }>>('chat-message', (event, { payload }) => {
  console.log(payload?.text);
});
```

## API

### `new WsClient(url, protocols?, options?)`

| Argument | Type | Description |
| --- | --- | --- |
| `url` | `string` | The URL to connect to |
| `protocols` | `string`, `string[]`, `null` | Subprotocols. Empty or `null` requests none |
| `options` | `object` | See below |

### Options

| Option | Default | Description |
| --- | --- | --- |
| `autoOpen` | `true` | Connect when the client is created |
| `autoReconnect` | `true` | Reconnect when the connection is lost |
| `reconnectInterval` | `1000` | Delay in ms before the first reconnect |
| `reconnectDecay` | `1.5` | Factor applied to the delay on every further reconnect |
| `maxReconnectTimeout` | `5000` | Maximum reconnect delay in ms |
| `maxReconnects` | `null` | Maximum number of reconnects, `null` for unlimited |
| `timeoutInterval` | `2000` | Time in ms before `onWsTimeout` fires for a pending connection |
| `maxSendTries` | `10` | Maximum tries for sending a message, 500 ms apart |
| `payloadItemName` | `'payload'` | Key of the payload in sent messages |
| `binaryType` | `'blob'` | Binary type of the WebSocket |
| `forceCloseOnReload` | `false` | Close the connection on page unload (main thread only) |
| `debug` | `false` | Log debug output |

### Callbacks

All callbacks are options and receive `(event, client)`.

| Callback | Called when | `event` |
| --- | --- | --- |
| `onBeforeWsOpen` | A connection is about to open | `undefined` |
| `onWsOpen` | A connection is ready | `Event` |
| `onWsMessage` | A message arrives (replaces the default handler) | `MessageEvent` |
| `onWsClose` | A connection is closed | `CloseEvent` |
| `onWsError` | A connection fails | `Event` |
| `onWsTimeout` | Connecting takes longer than `timeoutInterval` | `undefined` |
| `onMaxReconnects` | `maxReconnects` is reached | `undefined` |

### Methods

All methods return the client, so they can be chained.

| Method | Description |
| --- | --- |
| `addListener(type, callback)` | Listen for a message type. The callback receives `(event, message)` |
| `removeListener(type)` | Remove **all** listeners of a message type |
| `send(type, payload?)` | Send a message, opening the connection first if needed |
| `open()` | Open the connection |
| `close(code?, reason?)` | Close the connection. Call `open()` to connect again |

The underlying emitter is available as `client.emitter`. Use it to remove a single listener:

```javascript
const subscription = client.emitter.addListener('update', onUpdate);

subscription.remove();
```

## Limitations

- The default message handler only understands JSON text messages. For binary data, provide your own `onWsMessage`.
- Server messages can't use the name of a callback (like `onWsClose`) as their `type`. They are ignored.

## Development

```bash
npm install
npm run check  # lint, types and tests
npm run build  # creates dist/wsclientevented.js
npm run demo   # runs the example on http://localhost:9999
```

Tests use `node:test` with Node's native `WebSocket` against a real local server, so they need Node.js 22 or newer.

## Credits

This client would not have been possible without [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket) by [Joe Walnes](https://github.com/joewalnes). Check it out if you need something lower level.

## License

[MIT](LICENSE)
