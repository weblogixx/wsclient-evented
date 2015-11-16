'use strict';
var webpackCfg = require('./webpack.config');

module.exports = function(config) {
  config.set({
    basePath: '',
    browsers: [ 'Chrome' ],
    files: [
      'test/loadtests.js'
    ],
    port: 8080,
    captureTimeout: 60000,
    frameworks: [
      'phantomjs-shim',
      'mocha',
      'chai',
      'websocket-server'
    ],
    client: {
      mocha: {}
    },
    singleRun: true,
    reporters: [ 'mocha', 'coverage' ],
    preprocessors: {
      'test/loadtests.js': [ 'webpack', 'sourcemap' ]
    },
    webpack: webpackCfg,
    webpackServer: {
      noInfo: true
    },
    websocketServer: {
      port: 9999,
      beforeStart: (server) => {

        const CURRENT_PROTOCOL = 'wsclient-evented-protocol';

        server.on('request', (req) => {

          if(req.requestedProtocols.indexOf(CURRENT_PROTOCOL) === -1) {
            req.reject(404, `Wanted protocol is not implemented. Available protocols: ${CURRENT_PROTOCOL}`);
            return;
          }

          let connection = req.accept(CURRENT_PROTOCOL, req.origin);
          connection.on('message', (msg) => {

            if(msg.type === 'utf8') {

              let payload = JSON.parse(msg.utf8Data);

              switch(typeof payload) {
                case 'string':
                  connection.sendUTF(JSON.stringify(`${payload} - response`));
                  break;

                case 'object':
                default:
                  connection.sendUTF(JSON.stringify({
                    type: `${payload.type}-response`,
                    payload: payload.payload
                  }));
              }
            }
          });
        });
      }
    },
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        {
          type: 'html',
          subdir: 'html'
        },
        {
          type: 'text'
        }
      ]
    }
  });
};
