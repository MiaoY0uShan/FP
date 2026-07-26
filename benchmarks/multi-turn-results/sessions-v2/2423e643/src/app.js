const { Logger } = require('./logger');

/** @typedef {import('./ilogger').ILogger} ILogger */

const defaultLogger = new Logger('info');

/** @param {ILogger} [log] */
function run(log = defaultLogger) {
  log.log('App started');
  log.warn('Config missing');
  log.error('DB connection failed');
}

module.exports = { run };
