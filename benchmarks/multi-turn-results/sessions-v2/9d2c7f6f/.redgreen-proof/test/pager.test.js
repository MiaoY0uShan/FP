const { describe, it } = require('node:test');
const assert = require('assert');
const { paginate } = require('../src/pager');

describe('paginate', () => {
  it('splits items into full pages', () => {
    const pages = paginate([1, 2, 3, 4], 2);
    assert.equal(pages.length, 2);
    assert.deepEqual(pages[1], [3, 4]);
  });
  it('includes a final partial page', () => {
    const pages = paginate([1, 2, 3, 4, 5], 2);
    assert.equal(pages.length, 3);
    assert.deepEqual(pages[2], [5]);
  });
  it('rejects non-positive page size', () => {
    assert.throws(() => paginate([1], 0), /positive/);
  });
});
