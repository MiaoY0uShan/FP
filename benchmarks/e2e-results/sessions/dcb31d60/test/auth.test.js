const { describe, it } = require('node:test');
const { login } = require('../src/auth');
const assert = require('assert');

describe('Auth', () => {
  it('logs in with valid credentials', () => {
    const r = login('admin', 'secret123');
    assert.ok(r);
    assert.equal(r.user, 'admin');
  });

  it('rejects invalid credentials', () => {
    assert.equal(login('admin', 'wrong-password'), null);
  });

  it('rejects empty credentials', () => {
    assert.throws(() => login('', 'pass'), /missing/);
  });
});
