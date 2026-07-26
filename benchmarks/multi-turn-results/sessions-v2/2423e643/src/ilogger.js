class ILogger {
  log(_msg) { throw new Error('ILogger.log must be implemented'); }
  error(_msg) { throw new Error('ILogger.error must be implemented'); }
  warn(_msg) { throw new Error('ILogger.warn must be implemented'); }
  setLevel(_level) { throw new Error('ILogger.setLevel must be implemented'); }
}

module.exports = { ILogger };
