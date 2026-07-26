const { ILogger } = require('./ilogger');
const { Logger } = require('./logger');

/** @type {ILogger} */
const log = new Logger('silent');

function process() {
  log.log('Worker processing');
  log.error('Queue full');
}

module.exports = { process };
