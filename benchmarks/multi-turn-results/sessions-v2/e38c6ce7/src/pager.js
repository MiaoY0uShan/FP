function paginate(items, pageSize) {
  if (pageSize <= 0) throw new Error('pageSize must be positive');
  const pageCount = Math.ceil(items.length / pageSize);
  const pages = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(items.slice(i * pageSize, (i + 1) * pageSize));
  }
  return pages;
}
module.exports = { paginate };
