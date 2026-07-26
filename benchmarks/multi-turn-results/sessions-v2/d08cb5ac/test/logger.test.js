const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ILogger } = require('../src/ilogger');
const { Logger } = require('../src/logger');

describe('Logger', () => {
  it('should create logger with default level', () => {
    const l = new Logger();
    assert.equal(l.level, 'info');
  });

  it('should support silent level', () => {
    const l = new Logger('silent');
    assert.equal(l.level, 'silent');
  });

  it('should implement ILogger', () => {
    assert.ok(new Logger() instanceof ILogger);
  });
});
