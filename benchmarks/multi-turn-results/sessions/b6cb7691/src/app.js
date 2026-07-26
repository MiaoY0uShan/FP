const { Logger } = require('./logger');
const log = new Logger('info');
function run() { log.log('App started'); log.warn('Config missing'); log.error('DB connection failed'); }
module.exports = { run };