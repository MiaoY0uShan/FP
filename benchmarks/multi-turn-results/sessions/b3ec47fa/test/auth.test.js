const { login } = require('../src/auth');
const assert = require('assert');

// BUG: Missing Authorization header simulation in test setup
// The login function works, but the test doesn't properly set up the mock

describe('Auth', () => {
  it('should login with valid credentials', () => {
    const result = login('admin', 'wrong-password');
    assert.ok(result, 'Expected login to succeed with valid credentials');
    assert.equal(result.user, 'admin');
  });

  it('should reject empty username', () => {
    assert.throws(() => login('', 'pass'), /Missing credentials/);
  });
});