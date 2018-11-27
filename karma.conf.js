const webpackCfg = require('./webpack.config');

module.exports = function karmaConfig(config) {
  config.set({
    browsers: ['Chrome'],
    files: [
      'test/bootstrapTests.js',
    ],
    port: 9001,
    captureTimeout: 60000,
    frameworks: [
      'mocha',
      'websocket-server',
    ],
    client: {
      mocha: {},
    },
    singleRun: true,
    reporters: ['mocha', 'coverage'],
    mochaReporter: {
      output: 'autowatch',
      showDiff: true,
    },
    preprocessors: {
      'test/bootstrapTests.js': ['webpack', 'sourcemap'],
    },
    webpack: webpackCfg,
    websocketServer: {
      port: 9999,
      beforeStart: (server) => {
        const CURRENT_PROTOCOL = 'wsclient-evented-protocol';

        server.on('request', (req) => {
          if (req.requestedProtocols.indexOf(CURRENT_PROTOCOL) === -1) {
            req.reject(404, `Wanted protocol is not implemented. Available protocols: ${CURRENT_PROTOCOL}`);
            return;
          }

          const connection = req.accept(CURRENT_PROTOCOL, req.origin);
          connection.on('message', (msg) => {
            if (msg.type === 'utf8') {
              const payload = JSON.parse(msg.utf8Data);

              switch (typeof payload) {
                case 'string':
                  connection.sendUTF(JSON.stringify(`${payload} - response`));
                  break;

                case 'object':
                default:
                  connection.sendUTF(JSON.stringify({
                    type: `${payload.type}-response`,
                    payload: payload.payload,
                  }));
              }
            }
          });
        });
      },
    },
    coverageReporter: {
      dir: 'coverage/',
      watermarks: {
        statements: [85, 95],
        functions: [85, 95],
        branches: [85, 95],
        lines: [85, 95],
      },
      reporters: [
        { type: 'text-summary' },
        {
          type: 'html',
          subdir: 'html',
        },
        {
          type: 'cobertura',
          subdir: 'cobertura',
        },
        {
          type: 'lcovonly',
          subdir: 'lcov',
        },
      ],
    },
  });
};
