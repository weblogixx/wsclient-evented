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
      autoOpen: false,
      autoReconnect: false
    });

    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.be.null;
    expect(instance.settings).to.deep.equal({
      autoOpen: false,
      autoReconnect: false,
      debug: false,
      binaryType: 'blob',
      maxReconnects: null,
      maxSendTries: 10,
      maxReconnectTimeout: 5000,
      reconnectInterval: 1000,
      reconnectDecay: 1.5,
      timeoutInterval: 5000,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: null,
      onWsError: null,
      onWsClose: null,
      onWsTimeout: null
    });
  });

  it('should be able to run with url and protocol', () => {

    let instance = new WsClientEvented(wsUrl, 'test');
    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('test');

    instance.close();
  });

  it('should be able to override the default options with the provided ones', () => {

    let instance = new WsClientEvented(wsUrl, 'test', {
      debug: true,
      autoOpen: false,
      autoReconnect: false
    });

    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('test');
    expect(instance.settings).to.deep.equal({
      autoOpen: false,
      autoReconnect: false,
      debug: true,
      binaryType: 'blob',
      maxReconnects: null,
      maxSendTries: 10,
      reconnectInterval: 1000,
      reconnectDecay: 1.5,
      timeoutInterval: 5000,
      maxReconnectTimeout: 5000,
      onBeforeWsOpen: null,
      onWsOpen: null,
      onWsMessage: null,
      onWsError: null,
      onWsClose: null,
      onWsTimeout: null
    });

    instance.close();
  });
});

describe('when opening a websocket', () => {

  let instance;
  beforeEach(() => {
    instance = new WsClientEvented(wsUrl, wsProtocol, {
      autoOpen: false,
      autoReconnect: false
    });
  });

  afterEach(() => {
    instance.close();
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
    ws.close();
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

  it('should listen for the onWsTimeout event if the connection is not possible', (done) => {

    new WsClientEvented('ws://bogusConnect', null, {
      debug: true,
      autoReconnect: false,
      timeoutInterval: 50,
      onWsTimeout: (e, instance) => {
        expect(instance.ws.readyState).to.equal(WebSocket.CLOSED);
        instance.close();
        done();
      }
    });
  });

  describe('when adding events at the constructor', () => {

    it('should fire the the onBeforeWsOpen event', (done) => {
      new WsClientEvented(wsUrl, wsProtocol, {
        autoReconnect: false,
        onBeforeWsOpen: (e, instance) => {
          expect(instance).to.be.instanceOf(WsClientEvented);
          instance.close();
          done();
        }
      });
    });

    it('should fire the the onWsOpen event', (done) => {
      new WsClientEvented(wsUrl, wsProtocol, {
        autoReconnect: false,
        onWsOpen: (e, instance) => {
          expect(e.type).to.equal('open');
          expect(e.target.readyState).to.equal(1);
          expect(instance).to.be.instanceOf(WsClientEvented);
          instance.close();
          done();
        }
      });
    });

    it('should fire the onWsMessage event', (done) => {

      new WsClientEvented(wsUrl, wsProtocol, {
        autoReconnect: false,
        onWsOpen: (e, instance) => {
          instance.ws.send(JSON.stringify('message'));
        },
        onWsMessage: () => {
          expect(true).to.be.true;
          instance.close();
          done();
        }
      });
    });

    it('should fire the the onWsClose event', (done) => {

      let instance = new WsClientEvented(wsUrl, wsProtocol, {
        autoReconnect: false,
        onWsClose: (e, instance) => {
          expect(e.type).to.equal('close');
          expect(e.target.readyState).to.be.within(2, 3);
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

  it('should always require the message type', () => {
    expect(instance.send).to.throw(/Must provide an event type/);
  });

  it('should use a fluent interface', () => {
    expect(instance.send('x', 'y')).to.be.equal(instance);
  });

  it('should send the data over the open socket if it is connected', (done) => {

    instance.open();
    window.setTimeout(() => {
      instance.send('x', 'y');
      done();
    }, 100);
  });

  it('should automatically emit an event for any event type when it is received', (done) => {

    let newInstance = new WsClientEvented(wsUrl, wsProtocol);
    newInstance.emitter.addListener('test-response', (evt, response) => {
      expect(evt).to.be.instanceOf(MessageEvent);
      expect(response).to.deep.equal({
        type: 'test-response',
        payload: {
          my: 'data'
        }
      });

      done();
    });

    newInstance.send('test', {
      my: 'data'
    });
  });
});

describe('when adding or removing listeners', () => {

  let instance;
  beforeEach(() => {
    instance = new WsClientEvented(wsUrl, wsProtocol, {
      autoOpen: false,
      autoReconnect: false
    });
  });

  describe('when adding listeners via addListener', () => {

    it('should use a fluent interface', () => {
      expect(instance.addListener('test', function() {})).to.be.equal(instance);
    });

    it('should listen for the occured event', (done) => {

      instance.addListener('mymsg-response', (evt, response) => {
        expect(evt).to.be.instanceOf(MessageEvent);
        expect(response).to.deep.equal({
          type: 'mymsg-response',
          payload: {
            data: 'test'
          }
        });
        done();
      });

      instance.open();
      instance.send('mymsg', {
        data: 'test'
      });
    });
  });

  describe('when removing listeners via removeListener', () => {

    it('should use a fluent interface', () => {
      expect(instance.removeListener('test')).to.be.equal(instance);
    });

    it('should remove the listener for the given event', () => {

      instance.addListener('mymsg-response', () => {});
      expect(instance.emitter.listeners('mymsg-response')).to.have.length(1);

      instance.removeListener('mymsg-response');
      expect(instance.emitter.listeners('mymsg-response')).to.have.length(0);
    });
  });
});
