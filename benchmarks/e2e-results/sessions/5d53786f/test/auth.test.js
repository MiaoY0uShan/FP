const { describe, it } = require('node:test');
const assert = require('node:assert');
const { login } = require('../src/auth');

describe('Auth', () => {
  it('logs in with valid credentials', () => {
    const result = login('admin', 'secret123');

    assert.ok(result);
    assert.equal(result.user, 'admin');
  });

  it('rejects invalid credentials', () => {
    assert.equal(login('admin', 'wrong-password'), null);
  });

  it('rejects empty credentials', () => {
    assert.throws(() => login('', 'pass'), /missing/);
  });
});
