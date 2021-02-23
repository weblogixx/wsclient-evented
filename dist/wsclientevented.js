!function(e){var t={};function n(i){if(t[i])return t[i].exports;var r=t[i]={i:i,l:!1,exports:{}};return e[i].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(i,r,function(t){return e[t]}.bind(null,r));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=7)}([function(e,t,n){"use strict";var i=function(e){var t,n;function i(t,n,i){var r;return(r=e.call(this,t)||this).listener=n,r.context=i,r}return n=e,(t=i).prototype=Object.create(n.prototype),t.prototype.constructor=t,t.__proto__=n,i}(n(4));e.exports=i},function(e,t,n){"use strict";var i=function(e){};e.exports=function(e,t){for(var n=arguments.length,r=new Array(n>2?n-2:0),s=2;s<n;s++)r[s-2]=arguments[s];if(i(t),!e){var o;if(void 0===t)o=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var c=0;(o=new Error(t.replace(/%s/g,(function(){return String(r[c++])})))).name="Invariant Violation"}throw o.framesToPop=1,o}}},function(e,t,n){var i={EventEmitter:n(3),EmitterSubscription:n(0)};e.exports=i},function(e,t,n){"use strict";var i=n(0),r=n(5),s=n(1),o=n(6),c=function(){function e(){this._subscriber=new r,this._currentSubscription=null}var t=e.prototype;return t.addListener=function(e,t,n){return this._subscriber.addSubscription(e,new i(this._subscriber,t,n))},t.once=function(e,t,n){var i=this;return this.addListener(e,(function(){i.removeCurrentListener(),t.apply(n,arguments)}))},t.removeAllListeners=function(e){this._subscriber.removeAllSubscriptions(e)},t.removeCurrentListener=function(){this._currentSubscription||s(!1),this._subscriber.removeSubscription(this._currentSubscription)},t.listeners=function(e){var t=this._subscriber.getSubscriptionsForType(e);return t?t.filter(o.thatReturnsTrue).map((function(e){return e.listener})):[]},t.emit=function(e){var t=this._subscriber.getSubscriptionsForType(e);if(t){for(var n=Object.keys(t),i=0;i<n.length;i++){var r=n[i],s=t[r];s&&(this._currentSubscription=s,this.__emitToSubscription.apply(this,[s].concat(Array.prototype.slice.call(arguments))))}this._currentSubscription=null}},t.__emitToSubscription=function(e,t){var n=Array.prototype.slice.call(arguments,2);e.listener.apply(e.context,n)},e}();e.exports=c},function(e,t,n){"use strict";var i=function(){function e(e){this.subscriber=e}return e.prototype.remove=function(){this.subscriber&&(this.subscriber.removeSubscription(this),this.subscriber=null)},e}();e.exports=i},function(e,t,n){"use strict";var i=n(1),r=function(){function e(){this._subscriptionsForType={},this._currentSubscription=null}var t=e.prototype;return t.addSubscription=function(e,t){t.subscriber!==this&&i(!1),this._subscriptionsForType[e]||(this._subscriptionsForType[e]=[]);var n=this._subscriptionsForType[e].length;return this._subscriptionsForType[e].push(t),t.eventType=e,t.key=n,t},t.removeAllSubscriptions=function(e){void 0===e?this._subscriptionsForType={}:delete this._subscriptionsForType[e]},t.removeSubscription=function(e){var t=e.eventType,n=e.key,i=this._subscriptionsForType[t];i&&delete i[n]},t.getSubscriptionsForType=function(e){return this._subscriptionsForType[e]},e}();e.exports=r},function(e,t,n){"use strict";function i(e){return function(){return e}}var r=function(){};r.thatReturns=i,r.thatReturnsFalse=i(!1),r.thatReturnsTrue=i(!0),r.thatReturnsNull=i(null),r.thatReturnsThis=function(){return this},r.thatReturnsArgument=function(e){return e},e.exports=r},function(e,t,n){"use strict";n.r(t);var i=n(2);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}function c(e){return(c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}var u=function(e,t){var n=JSON.parse(e.data);"object"===c(n)&&n.type&&t.emitter.emit(n.type,e,n)},a=function(){function e(t){var n=this,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};s(this,e),this.emitter=new i.EventEmitter,this.url=t,this.protocols=r&&r.length>0?r:null,this.reconnectAttempts=0,this.forcedClose=!1,this.ws=null,this.sendTries={},this.settings={autoOpen:!0,autoReconnect:!0,debug:!1,forceCloseOnReload:!1,reconnectInterval:1e3,reconnectDecay:1.5,timeoutInterval:2e3,binaryType:"blob",payloadItemName:"payload",maxReconnects:null,maxSendTries:10,maxReconnectTimeout:5e3,onBeforeWsOpen:null,onWsOpen:null,onWsMessage:u.bind(this),onWsClose:null,onWsError:null,onMaxReconnects:null,onWsTimeout:null},Object.keys(o).forEach((function(e){n.settings[e]=o[e]})),["onBeforeWsOpen","onWsOpen","onWsMessage","onWsClose","onWsError","onMaxReconnects","onWsTimeout"].forEach((function(e){"function"==typeof n.settings[e]&&n.emitter.addListener(e,(function(t){n.settings[e](t,n)}))})),this.settings.autoOpen&&this.open(),this.settings.forceCloseOnReload&&self.addEventListener("beforeunload",(function(){n.close()}))}var t,n,c;return t=e,(n=[{key:"debug",value:function(e){this.settings.debug&&console.warn(e)}},{key:"addListener",value:function(e,t){return this.emitter.addListener(e,t),this}},{key:"removeListener",value:function(e){return this.emitter.removeAllListeners(e),this}},{key:"send",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!e)throw new Error("Must provide an event type, provided: ".concat(e));if(!this.ws){if(!this.settings.autoReconnect)return this.debug("Tried to send event ".concat(e,", but forced close was set. Please open the connection manually via #open!")),this;this.open()}switch(void 0===this.sendTries[e]&&(this.sendTries[e]=1),this.debug("Trying to send event ".concat(e," for the ").concat(this.sendTries[e]," time...")),this.ws.readyState){case WebSocket.CONNECTING:if(this.sendTries[e]>=this.settings.maxSendTries)return this.debug("WS still in connecting state, giving up after ".concat(this.settings.maxSendTries," tries for event ").concat(e)),this;this.sendTries[e]+=1,self.setTimeout((function(){t.send(e,n)}),500);break;case WebSocket.CLOSING:case WebSocket.CLOSED:if(this.sendTries[e]>=this.settings.maxSendTries)return this.debug("WS still in closing state, giving up after ".concat(this.settings.maxSendTries," tries for event ").concat(e)),this;this.sendTries[e]+=1,this.open(!0),self.setTimeout((function(){t.send(e,n)}),500);break;case WebSocket.OPEN:default:this.ws.send(JSON.stringify(r({type:e},this.settings.payloadItemName,n))),this.sendTries[e]=1}return this}},{key:"open",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(this.settings.maxReconnects&&this.reconnectAttempts>=this.settings.maxReconnects)return this.debug("Maximal amount of reconnects reached, giving up! Please call #open by yourself to retry."),this.emitter.emit("onMaxReconnects"),this;!t&&this.ws&&this.close(),this.emitter.emit("onBeforeWsOpen");var n=setTimeout((function(){e.debug("WS Connection timed out"),e.emitter.emit("onWsTimeout")}),this.settings.timeoutInterval);return this.ws=new WebSocket(this.url,this.protocols),this.ws.binaryType=this.settings.binaryType,this.ws.addEventListener("open",(function(t){clearTimeout(n),e.emitter.emit("onWsOpen",t,e),e.debug("WS connection successfully opened on attemp#".concat(e.reconnectAttempts,".")),e.reconnectAttempts=0,e.sendTries={}})),this.ws.addEventListener("message",(function(t){e.emitter.emit("onWsMessage",t,e)})),this.ws.addEventListener("close",(function(t){if(clearTimeout(n),e.emitter.emit("onWsClose",t,e),!e.forcedClose&&e.settings.autoReconnect){var i=e.settings.reconnectInterval*Math.pow(e.settings.reconnectDecay,e.reconnectAttempts);i>e.settings.maxReconnectTimeout&&(i=e.settings.maxReconnectTimeout),e.debug("Auto reconnect required, trying again in ".concat(i," ms...")),setTimeout((function(){e.reconnectAttempts+=1,e.open(!0),e.debug("WS connection timed out, trying to reconnect...")}),i)}else e.forcedClose&&(e.forcedClose=!1,e.debug("WS forced closing the connection"))})),this.ws.addEventListener("error",(function(t){e.emitter.emit("onWsError",t,e)})),this}},{key:"close",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1e3,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";return this.ws&&(this.forcedClose=!0,this.reconnectAttempts=0,this.sendTries={},this.ws.close(e,t),this.ws=null),this}}])&&o(t.prototype,n),c&&o(t,c),e}();window.WsClientEvented=a}]);
//# sourceMappingURL=wsclientevented.js.map