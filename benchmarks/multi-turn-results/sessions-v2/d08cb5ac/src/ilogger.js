class ILogger {
  log(msg) { throw new Error('ILogger.log must be implemented'); }
  error(msg) { throw new Error('ILogger.error must be implemented'); }
  warn(msg) { throw new Error('ILogger.warn must be implemented'); }
  setLevel(level) { throw new Error('ILogger.setLevel must be implemented'); }
}

module.exports = { ILogger };
