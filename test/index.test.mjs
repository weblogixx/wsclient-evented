import assert from 'node:assert/strict';
import {
  after, afterEach, before, describe, it,
} from 'node:test';
import WsClientEvented from '../lib/index.js';
import {
  PROTOCOL,
  createClientPool,
  delay,
  getClosedPort,
  startServer,
  startSilentServer,
  waitFor,
} from './helpers.mjs';

const DEFAULT_SETTINGS = {
  forceCloseOnReload: false,
  binaryType: 'blob',
  payloadItemName: 'payload',
  maxReconnects: null,
  maxSendTries: 10,
  maxReconnectTimeout: 5000,
  reconnectInterval: 1000,
  reconnectDecay: 1.5,
  timeoutInterval: 2000,
  onBeforeWsOpen: null,
  onWsOpen: null,
  onWsError: null,
  onWsClose: null,
  onWsTimeout: null,
};

const assertSettings = (instance, expected) => {
  Object.keys(expected).forEach((key) => {
    assert.equal(instance.settings[key], expected[key], `setting ${key}`);
  });
};

describe('WsClientEvented', () => {
  let server;
  const pool = createClientPool(WsClientEvented);
  const create = (options, protocols = PROTOCOL) => pool.create(server.url, protocols, options);

  before(async () => {
    server = await startServer();
  });

  afterEach(() => {
    pool.closeAll();
  });

  after(async () => {
    await server.stop();
  });

  describe('when creating a new instance', () => {
    it('should be able to run with just the url', () => {
      const instance = create({ autoOpen: false, autoReconnect: false }, '');

      assert.equal(instance.url, server.url);
      assert.equal(instance.protocols, null);
      assertSettings(instance, {
        ...DEFAULT_SETTINGS, autoOpen: false, autoReconnect: false, debug: false,
      });
      assert.equal(typeof instance.settings.onWsMessage, 'function');
    });

    it('should be able to run with url and protocol', () => {
      const instance = create({ autoReconnect: false }, 'test');

      assert.equal(instance.url, server.url);
      assert.equal(instance.protocols, 'test');
    });

    it('should be able to override the default options with the provided ones', () => {
      const instance = create({ debug: true, autoOpen: false, autoReconnect: false }, 'test');

      assert.equal(instance.protocols, 'test');
      assertSettings(instance, {
        ...DEFAULT_SETTINGS, autoOpen: false, autoReconnect: false, debug: true,
      });
      assert.equal(typeof instance.settings.onWsMessage, 'function');
    });
  });

  describe('when opening a websocket', () => {
    it('should use a fluent interface', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });
      assert.equal(instance.open(), instance);
    });

    it('should use auto opening per default', () => {
      let current;
      const instance = create({
        autoReconnect: false,
        onBeforeWsOpen: (_e, client) => {
          current = client;
        },
      });

      assert.equal(instance.settings.autoOpen, true);
      assert.ok(current instanceof WsClientEvented);
      assert.ok(instance.ws instanceof WebSocket);
    });

    it('should set the current websocket', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });

      assert.equal(instance.ws, null);
      instance.open();
      assert.ok(instance.ws instanceof WebSocket);
    });

    it('should close the old websocket and open a new one when called twice', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });

      instance.open();
      const oldWs = instance.ws;
      instance.open();

      assert.ok(oldWs instanceof WebSocket);
      assert.ok(instance.ws instanceof WebSocket);
      assert.notEqual(instance.ws, oldWs);
    });

    it('should fire onWsTimeout if the connection is not possible', async () => {
      const silent = await startSilentServer();
      let timedOutWith = null;
      const instance = pool.create(silent.url, null, {
        autoReconnect: false,
        timeoutInterval: 5,
        onWsTimeout: (_e, client) => {
          timedOutWith = client;
        },
      });

      await waitFor(() => timedOutWith !== null);
      assert.equal(timedOutWith, instance);

      pool.closeAll();
      await silent.stop();
    });

    it('should fire the onWsOpen event', async () => {
      let event;
      let current;
      const instance = create({
        autoReconnect: false,
        onWsOpen: (e, client) => {
          event = e;
          current = client;
        },
      });

      await waitFor(() => event);
      assert.equal(event.type, 'open');
      assert.equal(event.target.readyState, WebSocket.OPEN);
      assert.equal(current, instance);
    });

    it('should fire the onWsMessage event', async () => {
      let received = null;
      create({
        autoReconnect: false,
        onWsOpen: (_e, client) => client.ws.send(JSON.stringify('message')),
        onWsMessage: (e) => {
          received = e;
        },
      });

      await waitFor(() => received);
      assert.equal(JSON.parse(received.data), 'message - response');
    });

    it('should fire the onWsClose event', async () => {
      let event;
      let current;
      const instance = create({
        autoReconnect: false,
        onWsOpen: (_e, client) => client.ws.close(),
        onWsClose: (e, client) => {
          event = e;
          current = client;
        },
      });

      await waitFor(() => event);
      assert.equal(event.type, 'close');
      assert.ok(event.target.readyState >= WebSocket.CLOSING);
      assert.equal(current, instance);
    });

    it('should fire onWsError if the connection fails', async () => {
      const port = await getClosedPort();
      let error = null;
      pool.create(`ws://127.0.0.1:${port}`, null, {
        autoReconnect: false,
        onWsError: (e) => {
          error = e;
        },
      });

      await waitFor(() => error);
      assert.equal(error.type, 'error');
    });
  });

  describe('when closing a websocket connection', () => {
    it('should use a fluent interface', () => {
      const instance = create();
      assert.equal(instance.close(), instance);
    });

    it('should close the websocket with the default code', async () => {
      let code = null;
      create({
        onWsOpen: (_e, client) => client.close(),
        onWsClose: (e) => {
          code = e.code;
        },
      });

      await waitFor(() => code !== null);
      assert.equal(code, 1000);
    });

    it('should not reconnect after a forced close', async () => {
      let opens = 0;
      let closed = false;
      create({
        reconnectInterval: 5,
        onWsOpen: (_e, client) => {
          opens += 1;
          client.close();
        },
        onWsClose: () => {
          closed = true;
        },
      });

      await waitFor(() => closed);
      await delay(50);
      assert.equal(opens, 1);
    });
  });

  describe('when the connection gets lost', () => {
    it('should reconnect automatically and reset the attempts', async () => {
      let opens = 0;
      const instance = create({
        reconnectInterval: 5,
        onWsOpen: () => {
          opens += 1;
        },
      });

      await waitFor(() => opens === 1);
      server.dropClients();
      await waitFor(() => opens === 2);

      assert.equal(instance.reconnectAttempts, 0);
      assert.equal(instance.ws.readyState, WebSocket.OPEN);
    });

    it('should not reconnect if autoReconnect is off', async () => {
      let opens = 0;
      let closed = false;
      create({
        autoReconnect: false,
        reconnectInterval: 5,
        onWsOpen: () => {
          opens += 1;
        },
        onWsClose: () => {
          closed = true;
        },
      });

      await waitFor(() => opens === 1);
      server.dropClients();
      await waitFor(() => closed);
      await delay(50);

      assert.equal(opens, 1);
    });

    it('should back off up to the maximum and stop at maxReconnects', async (t) => {
      const port = await getClosedPort();
      const timeouts = t.mock.method(globalThis, 'setTimeout');
      let gaveUp = false;

      pool.create(`ws://127.0.0.1:${port}`, null, {
        reconnectInterval: 10,
        reconnectDecay: 2,
        maxReconnectTimeout: 25,
        maxReconnects: 3,
        onMaxReconnects: () => {
          gaveUp = true;
        },
      });

      await waitFor(() => gaveUp);
      const backoff = timeouts.mock.calls
        .map((call) => call.arguments[1])
        .filter((ms) => [10, 20, 25, 40].includes(ms));

      assert.deepEqual(backoff, [10, 20, 25]);
    });
  });

  describe('when sending a message', () => {
    it('should always require the message type', () => {
      const instance = create({ autoOpen: false });
      assert.throws(() => instance.send(), /Must provide an event type/);
    });

    it('should use a fluent interface', () => {
      const instance = create({ autoOpen: false });
      assert.equal(instance.send('x', 'y'), instance);
    });

    it('should send the data over the open socket if it is connected', async () => {
      let response = null;
      const instance = create({
        autoReconnect: false,
        onWsOpen: (_e, client) => client.send('x', 'y'),
      });
      instance.addListener('x-response', (_e, data) => {
        response = data;
      });

      await waitFor(() => response);
      assert.deepEqual(response, { type: 'x-response', payload: 'y' });
    });

    it('should emit an event for any event type when it is received', async () => {
      let event;
      let response;
      const instance = create();

      instance.emitter.addListener('test-response', (e, data) => {
        event = e;
        response = data;
      });
      instance.send('test', { my: 'data' });

      await waitFor(() => response, 3000);
      assert.ok(event instanceof MessageEvent);
      assert.deepEqual(response, { type: 'test-response', payload: { my: 'data' } });
    });

    it('should use the configured payload key', async () => {
      const raw = [];
      const instance = create({
        autoReconnect: false,
        payloadItemName: 'body',
        onWsOpen: (_e, client) => {
          const { ws } = client;
          const send = ws.send.bind(ws);
          ws.send = (message) => {
            raw.push(JSON.parse(message));
            send(message);
          };
          client.send('custom', { a: 1 });
        },
      });

      await waitFor(() => raw.length === 1);
      assert.deepEqual(raw[0], { type: 'custom', body: { a: 1 } });
      assert.ok(instance.ws);
    });

    it('should reopen a closed socket before sending', async () => {
      let opens = 0;
      let closed = false;
      let response = null;
      const instance = create({
        autoReconnect: false,
        onWsOpen: () => {
          opens += 1;
        },
        onWsClose: () => {
          closed = true;
        },
      });
      instance.addListener('late-response', (_e, data) => {
        response = data;
      });

      await waitFor(() => opens === 1);
      server.dropClients();
      await waitFor(() => closed);
      instance.send('late', 'message');

      await waitFor(() => response, 3000);
      assert.equal(opens, 2);
      assert.equal(response.payload, 'message');
    });

    it('should give up after maxSendTries while still connecting', async () => {
      const silent = await startSilentServer();
      const instance = pool.create(silent.url, null, {
        autoReconnect: false,
        maxSendTries: 2,
        timeoutInterval: 5000,
      });

      instance.send('never', 'sent');
      assert.equal(instance.sendTries.never, 2);
      await delay(600);
      assert.equal(instance.sendTries.never, 2);

      pool.closeAll();
      await silent.stop();
    });
  });

  describe('when adding or removing listeners', () => {
    it('should use a fluent interface for addListener', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });
      assert.equal(instance.addListener('test', () => null), instance);
    });

    it('should listen for the occurred event', async () => {
      let event;
      let response;
      const instance = create({ autoOpen: false, autoReconnect: false });

      instance.addListener('mymsg-response', (e, data) => {
        event = e;
        response = data;
      });
      instance.open();
      instance.send('mymsg', { data: 'test' });

      await waitFor(() => response, 3000);
      assert.ok(event instanceof MessageEvent);
      assert.deepEqual(response, { type: 'mymsg-response', payload: { data: 'test' } });
    });

    it('should use a fluent interface for removeListener', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });
      assert.equal(instance.removeListener('test'), instance);
    });

    it('should remove the listener for the given event', () => {
      const instance = create({ autoOpen: false, autoReconnect: false });

      instance.addListener('mymsg-response', () => {});
      assert.equal(instance.emitter.listeners('mymsg-response').length, 1);

      instance.removeListener('mymsg-response');
      assert.equal(instance.emitter.listeners('mymsg-response').length, 0);
    });
  });

  describe('when using a custom message handler', () => {
    it('should replace the default handler and may emit any event', async () => {
      let received = null;
      const instance = create({
        autoReconnect: false,
        onWsOpen: (_e, client) => client.send('custom', 1),
        onWsMessage: (e, client) => client.emitter.emit('onWsClose', e, client),
        onWsClose: (e) => {
          received = e;
        },
      });

      await waitFor(() => received);
      assert.equal(received.type, 'message');
      assert.ok(instance.ws);
    });
  });

  describe('when forceCloseOnReload is enabled', () => {
    it('should close the connection on beforeunload', async () => {
      const previousSelf = globalThis.self;
      const target = new EventTarget();
      globalThis.self = target;

      try {
        const instance = create({ autoOpen: false, forceCloseOnReload: true });
        instance.open();
        target.dispatchEvent(new Event('beforeunload'));
        assert.equal(instance.ws, null);
      } finally {
        globalThis.self = previousSelf;
      }
    });
  });
});
