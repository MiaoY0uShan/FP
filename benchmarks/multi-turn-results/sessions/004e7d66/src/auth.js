function login(username, password) {
  if (!username || !password) throw new Error('Missing credentials');
  if (username === 'admin' && password === 'secret123') {
    return { token: 'tok_' + Date.now(), user: username };
  }
  return null;
}
module.exports = { login };