/* eslint no-unused-vars: 0 */
import chai from 'chai';

import wsclient from '../lib/index';

global.chai = chai;
global.expect = chai.expect;

// Add support for all files in the test directory
const testsContext = require.context('.', true, /(Test\.js$)/);
testsContext.keys().forEach(testsContext);
