import net from 'node:net';
import { WebSocketServer } from 'ws';

export const PROTOCOL = 'wsclient-evented-protocol';

/**
 * Start a real WebSocket server on a free port. It selects PROTOCOL when offered, selects no
 * subprotocol otherwise, and answers every JSON message with a `<type>-response` message.
 */
export const startServer = () => new Promise((resolve) => {
  const requests = [];
  const wss = new WebSocketServer({
    host: '127.0.0.1',
    port: 0,
    handleProtocols: (protocols) => (protocols.has(PROTOCOL) ? PROTOCOL : false),
  });

  wss.on('connection', (socket, request) => {
    requests.push(request);
    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString());

      if (typeof message === 'string') {
        socket.send(JSON.stringify(`${message} - response`));
        return;
      }

      socket.send(JSON.stringify({
        type: `${message.type}-response`,
        payload: message.payload,
      }));
    });
  });

  wss.on('listening', () => {
    resolve({
      requests,
      url: `ws://127.0.0.1:${wss.address().port}`,
      dropClients: () => wss.clients.forEach((client) => client.terminate()),
      stop: () => new Promise((done) => {
        wss.clients.forEach((client) => client.terminate());
        wss.close(done);
      }),
    });
  });
});

/** Start a TCP server that accepts connections but never answers the WebSocket handshake. */
export const startSilentServer = () => new Promise((resolve) => {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
  });

  server.listen(0, '127.0.0.1', () => {
    resolve({
      url: `ws://127.0.0.1:${server.address().port}`,
      stop: () => new Promise((done) => {
        sockets.forEach((socket) => socket.destroy());
        server.close(done);
      }),
    });
  });
});

/** Get a local port that nothing is listening on. */
export const getClosedPort = () => new Promise((resolve) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
});

export const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

/** Poll until the predicate is true, or reject after the timeout. */
export const waitFor = async (predicate, timeout = 2000) => {
  const start = Date.now();

  while (!predicate()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Condition not met within ${timeout} ms: ${predicate}`);
    }
    await delay(5);
  }
};

/** Keep track of created clients so that a test can shut all of them down afterwards. */
export const createClientPool = (Client) => {
  const clients = [];

  return {
    create: (...args) => {
      const client = new Client(...args);
      clients.push(client);
      return client;
    },
    closeAll: () => {
      clients.splice(0).forEach((client) => {
        client.settings.autoReconnect = false;
        client.close();
      });
    },
  };
};
