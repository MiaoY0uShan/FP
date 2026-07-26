const { Logger } = require('./logger');

/** @typedef {import('./ilogger').ILogger} ILogger */

const defaultLogger = new Logger('silent');

/** @param {ILogger} [log] */
function process(log = defaultLogger) {
  log.log('Worker processing');
  log.error('Queue full');
}

module.exports = { process };
