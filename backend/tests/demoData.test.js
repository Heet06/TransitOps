const test = require('node:test');
const assert = require('node:assert/strict');
const { isoDate } = require('../scripts/demoData');

test('isoDate returns YYYY-MM-DD formatted dates', () => {
  assert.match(isoDate(0), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(isoDate(12), /^\d{4}-\d{2}-\d{2}$/);
});

test('isoDate offset moves date forward', () => {
  assert.ok(isoDate(1) > isoDate(0));
});
