class ILogger {
  constructor() {
    if (new.target === ILogger) {
      throw new TypeError('ILogger is an interface and cannot be instantiated directly');
    }
  }

  log(msg) { throw new Error('log(msg) must be implemented'); }
  error(msg) { throw new Error('error(msg) must be implemented'); }
  warn(msg) { throw new Error('warn(msg) must be implemented'); }
  setLevel(level) { throw new Error('setLevel(level) must be implemented'); }
}

module.exports = { ILogger };
