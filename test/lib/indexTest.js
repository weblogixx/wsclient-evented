/*eslint-env node, mocha */
/*global expect */
/*eslint no-console: 0*/
'use strict';

import WsClientEvented from '../../lib/index';

const wsUrl = 'ws://localhost:9999';
const wsProtocol = 'wsclient-evented-protocol';

describe('when creating a new WsClientEvented instance', () => {

  it('should be able to run with just the url', () => {

    let instance = new WsClientEvented(wsUrl);

    expect(instance.url).to.equal(wsUrl);
    expect(instance.protocols).to.deep.equal('');
    expect(instance.settings).to.deep.equal({
      debug: false,
      autoOpen: true,
      binaryType: 'blob'
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
      binaryType: 'blob'
    });
  });
});

describe('when opening a websocket instance', () => {

  let instance;
  beforeEach(() => {
    instance = new WsClientEvented(wsUrl, wsProtocol);
  });

  it('should use a fluent interface', () => {
    expect(instance.open()).to.be.equal(instance);
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
});
