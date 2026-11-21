import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import EventEmitter from '../lib/emitter.js';

describe('EventEmitter', () => {
  it('passes all emitted arguments to a listener', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.addListener('evt', (...args) => calls.push(args));
    emitter.emit('evt', 1, 'two', { three: 3 });

    assert.deepEqual(calls, [[1, 'two', { three: 3 }]]);
  });

  it('calls listeners in the order they were added', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.addListener('evt', () => calls.push('first'));
    emitter.addListener('evt', () => calls.push('second'));
    emitter.emit('evt');

    assert.deepEqual(calls, ['first', 'second']);
  });

  it('does nothing when emitting an event without listeners', () => {
    assert.doesNotThrow(() => new EventEmitter().emit('nobody-listens'));
  });

  it('calls a listener with the given context', () => {
    const emitter = new EventEmitter();
    const context = {};
    let received;

    emitter.addListener('evt', function listener() {
      received = this;
    }, context);
    emitter.emit('evt');

    assert.equal(received, context);
  });

  it('returns a subscription that can remove its listener', () => {
    const emitter = new EventEmitter();
    let calls = 0;

    const subscription = emitter.addListener('evt', () => {
      calls += 1;
    });
    emitter.emit('evt');
    subscription.remove();
    emitter.emit('evt');

    assert.equal(calls, 1);
    assert.equal(emitter.listeners('evt').length, 0);
  });

  it('exposes the listener functions via listeners()', () => {
    const emitter = new EventEmitter();
    const first = () => {};
    const second = () => {};

    emitter.addListener('evt', first);
    emitter.addListener('evt', second);

    assert.deepEqual(emitter.listeners('evt'), [first, second]);
    assert.deepEqual(emitter.listeners('other'), []);
  });

  it('calls a once() listener a single time with its context', () => {
    const emitter = new EventEmitter();
    const context = {};
    const calls = [];

    emitter.once('evt', function listener(value) {
      calls.push([this, value]);
    }, context);
    emitter.emit('evt', 1);
    emitter.emit('evt', 2);

    assert.deepEqual(calls, [[context, 1]]);
    assert.equal(calls[0][0], context);
  });

  it('removes the listeners of one type only', () => {
    const emitter = new EventEmitter();

    emitter.addListener('a', () => {});
    emitter.addListener('b', () => {});
    emitter.removeAllListeners('a');

    assert.equal(emitter.listeners('a').length, 0);
    assert.equal(emitter.listeners('b').length, 1);
  });

  it('removes all listeners when no type is given', () => {
    const emitter = new EventEmitter();

    emitter.addListener('a', () => {});
    emitter.addListener('b', () => {});
    emitter.removeAllListeners();

    assert.equal(emitter.listeners('a').length, 0);
    assert.equal(emitter.listeners('b').length, 0);
  });

  it('removes the running listener via removeCurrentListener()', () => {
    const emitter = new EventEmitter();
    let calls = 0;

    emitter.addListener('evt', () => {
      calls += 1;
      emitter.removeCurrentListener();
    });
    emitter.emit('evt');
    emitter.emit('evt');

    assert.equal(calls, 1);
  });

  it('throws on removeCurrentListener() outside of an emit', () => {
    assert.throws(() => new EventEmitter().removeCurrentListener());
  });

  it('skips a listener that gets removed during the same emit', () => {
    const emitter = new EventEmitter();
    const calls = [];
    let second = null;

    emitter.addListener('evt', () => {
      calls.push('first');
      second.remove();
    });
    second = emitter.addListener('evt', () => calls.push('second'));
    emitter.addListener('evt', () => calls.push('third'));
    emitter.emit('evt');

    assert.deepEqual(calls, ['first', 'third']);
  });

  it('still finishes the running emit after removeAllListeners()', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.addListener('evt', () => {
      calls.push('first');
      emitter.removeAllListeners('evt');
    });
    emitter.addListener('evt', () => calls.push('second'));
    emitter.emit('evt');
    emitter.emit('evt');

    assert.deepEqual(calls, ['first', 'second']);
  });

  it('does not call a listener added during the running emit', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.once('evt', () => {
      calls.push('first');
      emitter.addListener('evt', () => calls.push('late'));
    });
    emitter.emit('evt');
    assert.deepEqual(calls, ['first']);

    emitter.emit('evt');
    assert.deepEqual(calls, ['first', 'late']);
  });

  it('lets a throwing listener propagate and stops the emit', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.addListener('evt', () => {
      throw new Error('listener failed');
    });
    emitter.addListener('evt', () => calls.push('second'));

    assert.throws(() => emitter.emit('evt'), /listener failed/);
    assert.deepEqual(calls, []);
  });

  it('supports nested emits', () => {
    const emitter = new EventEmitter();
    const calls = [];

    emitter.addListener('outer', () => {
      calls.push('outer');
      emitter.emit('inner');
    });
    emitter.addListener('inner', () => calls.push('inner'));
    emitter.emit('outer');

    assert.deepEqual(calls, ['outer', 'inner']);
  });
});
