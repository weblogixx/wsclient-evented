/**
 * A single registered listener. Returned by EventEmitter#addListener and EventEmitter#once.
 */
class EmitterSubscription {

  /**
   * @param {EventEmitter} emitter The emitter this subscription belongs to
   * @param {String} eventType Name of the event
   * @param {Function} listener Function to call
   * @param {*} context Value of `this` for the listener [optional]
   */
  constructor(emitter, eventType, listener, context) {
    this.emitter = emitter;
    this.eventType = eventType;
    this.listener = listener;
    this.context = context;
  }

  /**
   * Remove this listener from its emitter
   */
  remove() {
    this.emitter.removeSubscription(this);
  }
}

/**
 * Minimal event emitter, API compatible with the parts of fbemitter used up to version 2.2.0.
 * Written without Map or Set, as the browser bundle still supports IE 10 and 11.
 */
export default class EventEmitter {

  constructor() {
    // No prototype, as event names can come from the server (e.g. "constructor" or "__proto__")
    this.subscriptions = Object.create(null);
    this.currentSubscription = null;
  }

  /**
   * Add a listener for an event
   * @param {String} eventType Name of the event
   * @param {Function} listener Function to call
   * @param {*} context Value of `this` for the listener [optional]
   * @return {EmitterSubscription}
   */
  addListener(eventType, listener, context) {
    const subscription = new EmitterSubscription(this, eventType, listener, context);

    if (!this.subscriptions[eventType]) {
      this.subscriptions[eventType] = [];
    }
    this.subscriptions[eventType].push(subscription);

    return subscription;
  }

  /**
   * Add a listener that is removed after its first call
   * @param {String} eventType Name of the event
   * @param {Function} listener Function to call
   * @param {*} context Value of `this` for the listener [optional]
   * @return {EmitterSubscription}
   */
  once(eventType, listener, context) {
    return this.addListener(eventType, (...args) => {
      this.removeCurrentListener();
      listener.apply(context, args);
    });
  }

  /**
   * Remove all listeners of an event, or every listener if no event is given
   * @param {String} eventType Name of the event [optional]
   */
  removeAllListeners(eventType) {
    if (eventType === undefined) {
      this.subscriptions = Object.create(null);
    } else {
      delete this.subscriptions[eventType];
    }
  }

  /**
   * Remove the listener that is currently being called
   * @throws {Error} When called outside of an emit
   */
  removeCurrentListener() {
    if (!this.currentSubscription) {
      throw new Error('Not in an emitting cycle; there is no current subscription');
    }
    this.removeSubscription(this.currentSubscription);
  }

  /**
   * Remove a single subscription
   * @param {EmitterSubscription} subscription
   */
  removeSubscription(subscription) {
    const subscriptions = this.subscriptions[subscription.eventType];

    if (subscriptions) {
      const index = subscriptions.indexOf(subscription);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }
  }

  /**
   * Get the listener functions of an event
   * @param {String} eventType Name of the event
   * @return {Function[]}
   */
  listeners(eventType) {
    const subscriptions = this.subscriptions[eventType];
    return subscriptions ? subscriptions.map((subscription) => subscription.listener) : [];
  }

  /**
   * Call all listeners of an event
   * @param {String} eventType Name of the event
   * @param {...*} args Arguments for the listeners
   */
  emit(eventType, ...args) {
    const subscriptions = this.subscriptions[eventType];

    if (!subscriptions) {
      return;
    }

    // Work on a copy: listeners added now wait for the next emit, removed ones get skipped
    subscriptions.slice().forEach((subscription) => {
      if (subscriptions.indexOf(subscription) !== -1) {
        this.currentSubscription = subscription;
        subscription.listener.apply(subscription.context, args);
      }
    });

    this.currentSubscription = null;
  }
}
