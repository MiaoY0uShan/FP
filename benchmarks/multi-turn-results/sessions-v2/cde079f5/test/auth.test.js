const { describe, it } = require('node:test');
const { login } = require('../src/auth');
const assert = require('assert');

describe('Auth', () => {
  it('should login with valid credentials', () => {
    const result = login('admin', 'secret123');
    assert.ok(result, 'Expected login to succeed with valid credentials');
    assert.equal(result.user, 'admin');
  });
  it('should reject empty username', () => {
    assert.throws(() => login('', 'pass'), /Missing credentials/);
  });
});