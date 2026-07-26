const { Logger } = require('./logger');

/**
 * Run the application with an ILogger implementation.
 * @param {import('./ilogger').ILogger} log
 */
function run(log = new Logger('info')) {
  log.log('App started');
  log.warn('Config missing');
  log.error('DB connection failed');
}

module.exports = { run };
