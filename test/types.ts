import WsClientEvented, { type WsClientOptions, type WsMessage } from '../lib/index.mjs';

const options: WsClientOptions = {
  maxReconnects: null,
  onBeforeWsOpen: (event, client) => {
    const none: undefined = event;
    client.send('opening', none);
  },
  onWsOpen: null,
  onWsClose: (event) => {
    const code: number = event.code;
    console.log(code);
  },
  onWsMessage: (event, client) => {
    client.emitter.emit('custom', event.data);
  },
};

new WsClientEvented('ws://localhost');
new WsClientEvented('ws://localhost', null);
new WsClientEvented('ws://localhost', ['a', 'b'], options);

const client: WsClientEvented = new WsClientEvented('ws://localhost', 'protocol')
  .addListener('any', (event, message) => {
    const data: unknown = event.data;
    const type: string = message.type;
    console.log(data, type);
  })
  .addListener<WsMessage<{ sent: boolean }>>('typed', (_event, { payload }) => {
    const sent: boolean | undefined = payload?.sent;
    console.log(sent);
  })
  .send('type')
  .removeListener('any');

const subscription = client.emitter.addListener('raw', (...args) => console.log(args));
subscription.remove();
client.close(1000, 'done').open();

// @ts-expect-error The url is required
new WsClientEvented();
// @ts-expect-error Unknown options are rejected
new WsClientEvented('ws://localhost', null, { autoReconect: true });
