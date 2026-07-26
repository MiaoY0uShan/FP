const { ILogger } = require('./ilogger');
const { Logger } = require('./logger');

/** @param {ILogger} log */
function run(log = new Logger('info')) {
  log.log('App started');
  log.warn('Config missing');
  log.error('DB connection failed');
}
module.exports = { run };
