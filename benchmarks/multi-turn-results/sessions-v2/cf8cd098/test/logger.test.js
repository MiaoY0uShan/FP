const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ILogger } = require('../src/ilogger');
const { Logger } = require('../src/logger');

describe('Logger', () => {
  it('should create logger with default level', () => {
    const logger = new Logger();
    assert.equal(logger.level, 'info');
    assert.ok(logger instanceof ILogger);
  });

  it('should support silent level', () => {
    const logger = new Logger('silent');
    assert.equal(logger.level, 'silent');
  });

  it('should require interface methods to be implemented', () => {
    const logger = new ILogger();
    assert.throws(() => logger.log('message'), /ILogger\.log must be implemented/);
  });
});
