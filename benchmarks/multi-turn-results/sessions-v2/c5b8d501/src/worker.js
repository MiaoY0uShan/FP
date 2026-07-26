const { Logger } = require('./logger');

/** @type {import('./ilogger').ILogger} */
const log = new Logger('silent');

function process() { log.log('Worker processing'); log.error('Queue full'); }

module.exports = { process };
