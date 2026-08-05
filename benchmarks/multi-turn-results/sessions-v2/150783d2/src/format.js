function formatName(user) {
  var s = '';
  if (user.title) { s = s + user.title + ' '; }
  s = s + user.first;
  if (user.middle) { s = s + ' ' + user.middle; }
  if (user.last) { s = s + ' ' + user.last; }
  if (user.suffix) { s = s + ', ' + user.suffix; }
  return s;
}
module.exports = { formatName };
