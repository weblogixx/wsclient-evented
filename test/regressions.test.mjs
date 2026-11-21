import assert from 'node:assert/strict';
import {
  after, afterEach, before, describe, it,
} from 'node:test';
import WsClientEvented from '../lib/index.js';
import {
  createClientPool, delay, startServer, waitFor,
} from './helpers.mjs';

describe('fixed in 2.3.0', () => {
  let server;
  const pool = createClientPool(WsClientEvented);

  before(async () => {
    server = await startServer();
  });

  afterEach(() => {
    pool.closeAll();
  });

  after(async () => {
    await server.stop();
  });

  for (const [name, protocols] of [['undefined', undefined], ['an empty string', ''], ['null', null]]) {
    it(`should connect without a subprotocol when protocols is ${name}`, async () => {
      const before = server.requests.length;
      let opened = false;
      let failed = false;

      pool.create(server.url, protocols, {
        autoReconnect: false,
        onWsOpen: () => {
          opened = true;
        },
        onWsError: () => {
          failed = true;
        },
      });

      await waitFor(() => opened || failed);
      assert.equal(failed, false);
      assert.equal(server.requests[before].headers['sec-websocket-protocol'], undefined);
    });
  }

  it('should ignore a null message from the server', () => {
    const client = pool.create(server.url, null, { autoOpen: false, autoReconnect: false });

    assert.doesNotThrow(() => client.settings.onWsMessage({ data: 'null' }, client));
  });

  it('should not recurse on a message named like the message event', () => {
    const client = pool.create(server.url, null, { autoOpen: false, autoReconnect: false });
    const message = { data: JSON.stringify({ type: 'onWsMessage' }) };

    assert.doesNotThrow(() => client.emitter.emit('onWsMessage', message, client));
  });

  for (const type of ['onBeforeWsOpen', 'onWsOpen', 'onWsClose', 'onWsError', 'onMaxReconnects', 'onWsTimeout']) {
    it(`should not let a server message fire the ${type} callback`, () => {
      let calls = 0;
      const client = pool.create(server.url, null, {
        autoOpen: false,
        autoReconnect: false,
        [type]: () => {
          calls += 1;
        },
      });

      client.settings.onWsMessage({ data: JSON.stringify({ type }) }, client);
      assert.equal(calls, 0);
    });
  }

  it('should not reconnect when closed while waiting for a reconnect', async () => {
    let opens = 0;
    let closes = 0;
    const client = pool.create(server.url, null, {
      reconnectInterval: 40,
      onWsOpen: () => {
        opens += 1;
      },
      onWsClose: () => {
        closes += 1;
      },
    });

    await waitFor(() => opens === 1);
    server.dropClients();
    await waitFor(() => closes === 1);
    client.close();
    await delay(120);

    assert.equal(opens, 1);
    assert.equal(client.ws, null);
  });

  it('should still reconnect after being closed during a reconnect wait and reopened', async () => {
    let opens = 0;
    let closes = 0;
    const client = pool.create(server.url, null, {
      reconnectInterval: 40,
      onWsOpen: () => {
        opens += 1;
      },
      onWsClose: () => {
        closes += 1;
      },
    });

    await waitFor(() => opens === 1);
    server.dropClients();
    await waitFor(() => closes === 1);
    client.close();
    await delay(120);

    const opensBefore = opens;
    client.open();
    await waitFor(() => opens === opensBefore + 1);
    server.dropClients();
    await waitFor(() => opens === opensBefore + 2);

    assert.equal(client.ws.readyState, WebSocket.OPEN);
  });

  it('should still deliver regular messages', () => {
    const client = pool.create(server.url, null, { autoOpen: false, autoReconnect: false });
    let received = null;

    client.addListener('regular', (_e, data) => {
      received = data;
    });
    client.settings.onWsMessage({ data: JSON.stringify({ type: 'regular', payload: 1 }) }, client);

    assert.deepEqual(received, { type: 'regular', payload: 1 });
  });
});
