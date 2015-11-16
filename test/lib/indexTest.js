/*eslint-env node, mocha */
/*global expect */
/*eslint no-console: 0*/
'use strict';

import WsClientEvented from '../../lib/index';

const wsUrl = 'ws://localhost:9999';
const wsProtocol = 'wsclient-evented-protocol';

describe('when creating a new WsClientEvented instance', () => {

  it('should be able to run with just the url', () => {

    let instance = new WsClientEvented(wsUrl, '', {
      autoOpen: false
    });

    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('');
    expect(instance.settings).to.deep.equal({
      autoOpen: false,
      binaryType: 'blob',
      reconnectInterval: 250,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: null,
      onWsError: null,
      onWsClose: null
    });
  });

  it('should be able to run with url and protocol', () => {

    let instance = new WsClientEvented(wsUrl, 'test');
    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('test');
  });

  it('should be able to override the default options with the provided ones', () => {

    let instance = new WsClientEvented(wsUrl, 'test', {
      debug: true,
      autoOpen: false
    });

    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('test');
    expect(instance.settings).to.deep.equal({
      debug: true,
      autoOpen: false,
      binaryType: 'blob',
      reconnectInterval: 250,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: null,
      onWsError: null,
      onWsClose: null
    });
  });
});

describe('when opening a websocket instance', () => {

  let instance;
  beforeEach(() => {
    instance = new WsClientEvented(wsUrl, wsProtocol, {
      autoOpen: false
    });
  });

  it('should use a fluent interface', () => {
    expect(instance.open()).to.be.equal(instance);
  });

  it('should use auto opening per default', (done) => {

    let ws = new WsClientEvented(wsUrl, wsProtocol, {
      onBeforeWsOpen: (e, current) => {
        expect(current).to.be.instanceOf(WsClientEvented);
        done();
      }
    });

    expect(ws.settings.autoOpen).to.be.true;
    expect(ws.ws).to.be.null;
  });

  it('should set the current websocket', () => {
    expect(instance.ws).to.be.null;
    instance.open();
    expect(instance.ws).to.be.instanceOf(WebSocket);
  });

  it('should close the old websocket and open a new one when called twice', () => {

    instance.open();
    let oldWs = instance.ws;

    instance.open();
    let newWs = instance.ws;

    expect(oldWs).to.be.instanceOf(WebSocket);
    expect(newWs).to.be.instanceOf(WebSocket);
    expect(newWs).to.not.equal(oldWs);
  });

  describe('when adding events at the constructor', () => {

    it('should fire the the onBeforeWsOpen event', (done) => {
      new WsClientEvented(wsUrl, wsProtocol, {
        onBeforeWsOpen: (e, instance) => {
          expect(instance).to.be.instanceOf(WsClientEvented);
          done();
        }
      });
    });

    it('should fire the the onWsOpen event', (done) => {
      new WsClientEvented(wsUrl, wsProtocol, {
        onWsOpen: (e, instance) => {
          expect(e.type).to.equal('open');
          expect(e.target.readyState).to.equal(1);
          expect(instance).to.be.instanceOf(WsClientEvented);
          done();
        }
      });
    });

    it('should fire the onWsMessage event', (done) => {

      new WsClientEvented(wsUrl, wsProtocol, {
        onWsOpen: (e, instance) => {
          instance.ws.send(JSON.stringify('message'));
        },
        onWsMessage: () => {
          expect(true).to.be.true;
          done();
        }
      });
    });

    it('should fire the the onWsClose event', (done) => {

      let instance = new WsClientEvented(wsUrl, wsProtocol, {
        onWsClose: (e, instance) => {
          expect(e.type).to.equal('close');
          expect(e.target.readyState).to.equal(3);
          expect(instance).to.be.instanceOf(WsClientEvented);
          done();
        }
      });

      instance.ws.close();
    });

  });
});

describe('when closing a websocket connection', () => {

  it('should use a fluent interface', () => {
    let instance = new WsClientEvented(wsUrl, wsProtocol);
    expect(instance.close()).to.be.equal(instance);
  });

  it('should close the websocket with the default reason', (done) => {

    new WsClientEvented(wsUrl, wsProtocol, {
      onWsOpen: (e, instance) => {
        instance.close();
      },
      onWsClose: (e) => {
        expect(e.code).to.equal(1000);
        done();
      }
    });
  });
});

describe('when sending a message', () => {

  let instance;
  beforeEach(() => {
    instance = new WsClientEvented(wsUrl, wsProtocol, {
      autoOpen: false
    });
  });

  it('should always require the message type, as well as the payload', () => {
    expect(instance.send).to.throw(/Must provide type and payload/);
  });

  it('should use a fluent interface', () => {
    expect(instance.send('x', 'y')).to.be.equal(instance);
  });

  it('should automatically open the socket if it is not available yet', (done) => {

    instance.emitter.addListener('onWsMessage', () => {
      expect(instance.ws).to.be.instanceOf(WebSocket);
      done();
    });

    expect(instance.ws).to.be.null;
    instance.send('event', 'data');
  });

  it('should just send the data over the opened socket if it is already connected', (done) => {

    instance.open();
    window.setTimeout(() => {
      instance.send('x', 'y');
      done();
    }, 100);
  });

  it('should automatically emit an event for any event type when it is received', (done) => {

    instance.emitter.addListener('test-response', (response) => {
      expect(response).to.deep.equal({
        type: 'test-response',
        payload: {
          my: 'data'
        }
      });

      done();
    });

    instance.send('test', {
      my: 'data'
    });
  });
});
