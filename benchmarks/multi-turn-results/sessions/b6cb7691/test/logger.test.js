const { Logger } = require('../src/logger');
const assert = require('assert');
describe('Logger', () => {
  it('should create logger with default level', () => {
    const l = new Logger();
    assert.equal(l.level, 'info');
  });
});