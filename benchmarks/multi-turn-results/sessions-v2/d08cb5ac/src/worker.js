const { Logger } = require('./logger');

/**
 * Process work with an ILogger implementation.
 * @param {import('./ilogger').ILogger} log
 */
function process(log = new Logger('silent')) {
  log.log('Worker processing');
  log.error('Queue full');
}

module.exports = { process };
