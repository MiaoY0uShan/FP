const { Logger } = require('./logger');
const log = new Logger('silent');
function process() { log.log('Worker processing'); log.error('Queue full'); }
module.exports = { process };