const { ILogger } = require('./ilogger');
const { Logger } = require('./logger');

/** @type {ILogger} */
const log = new Logger('info');

function run() {
  log.log('App started');
  log.warn('Config missing');
  log.error('DB connection failed');
}

module.exports = { run };
