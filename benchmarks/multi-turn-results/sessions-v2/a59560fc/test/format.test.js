const { describe, it } = require('node:test');
const assert = require('assert');
const { formatName } = require('../src/format');

describe('formatName', () => {
  it('formats first and last', () => {
    assert.equal(formatName({ first: 'Ada', last: 'Lovelace' }), 'Ada Lovelace');
  });
  it('includes middle name', () => {
    assert.equal(formatName({ first: 'Ada', middle: 'Byron', last: 'Lovelace' }), 'Ada Byron Lovelace');
  });
  it('includes title and suffix', () => {
    assert.equal(formatName({ title: 'Dr.', first: 'Ada', last: 'Lovelace', suffix: 'PhD' }), 'Dr. Ada Lovelace, PhD');
  });
});
