/**
 * Set up environment depending on if we're in a browser or node.
 */
if (typeof require === 'function') {
  global.expect = require('chai').expect;
  global.Protomatter = require('../protomatter');
  global.sinon = require('sinon');
} else {
  window.expect = window.chai.expect;
}
