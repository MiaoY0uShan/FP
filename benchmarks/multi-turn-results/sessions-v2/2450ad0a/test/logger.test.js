const { describe, it } = require('node:test');
const assert = require('node:assert');
const { ILogger } = require('../src/ilogger');
const { Logger } = require('../src/logger');

describe('Logger', () => {
  it('should implement ILogger with the default level', () => {
    const logger = new Logger();
    assert.ok(logger instanceof ILogger);
    assert.equal(logger.level, 'info');
  });

  it('should support silent level', () => {
    const logger = new Logger('silent');
    assert.equal(logger.level, 'silent');
  });
});
