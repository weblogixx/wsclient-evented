# wsclient-evented
> A (very) simple Websocket client wrapper with event support.

## Why should I use it?
wsclient-evented is just an easy wrapper for the native websocket client.
It adds some often needed functionality like

- [x] Automatic reconnects when connections get closed
- [x] A send method that automatically opens the connection if unavailable
- [x] Possibility to listen for any occured events without big switch statements in onMessage
- [x] Automatically parsing of payloads
- [x] Cross browser compatible

## Missing features
- [ ] Currently no support for binary data

-----

## Installation
There are two possibilities to use the client:

### Old school import:
Just add the file dist/browser.js into your url to make window.WsClientEvented available.

Example:
```html
<script src="wsclientevented/dist/browser.js"></script>
<script>
var wsClient = new WsClientEvented('ws://url');
wsClient.send('x');
</script>
```

### ES2015 import
If you are using webpack or native ES2015 imports, you may use the client like this:

```javascript
import WsClient from 'wsclient-evented';
let wsClient = new WsClient('ws://url');
wsClient.send('x');
```

## Usage
