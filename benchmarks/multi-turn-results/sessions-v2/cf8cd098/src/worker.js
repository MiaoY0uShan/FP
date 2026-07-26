const { ILogger } = require('./ilogger');
const { Logger } = require('./logger');

/** @param {ILogger} log */
function process(log = new Logger('silent')) {
  log.log('Worker processing');
  log.error('Queue full');
}
module.exports = { process };
