const { ILogger } = require('./ilogger');

class Logger extends ILogger {
  constructor(level = 'info') { super(); this.level = level; }
  log(msg) { if (this.level !== 'silent') console.log('[LOG]', msg); }
  error(msg) { console.error('[ERR]', msg); }
  warn(msg) { if (this.level !== 'silent') console.warn('[WARN]', msg); }
  setLevel(level) { this.level = level; }
}
module.exports = { Logger };
