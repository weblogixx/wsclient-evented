'use strict';

// Add support for all files in the test directory
const testsContext = require.context('.', true, /(Test\.js$)/);
testsContext.keys().forEach(testsContext);
