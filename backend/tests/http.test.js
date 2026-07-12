const test = require('node:test');
const assert = require('node:assert/strict');
const { rowsToCsv, buildSimplePdf } = require('../utils/http');

test('rowsToCsv escapes commas, quotes, and newlines', () => {
  const csv = rowsToCsv(
    [
      { key: 'name', label: 'Name' },
      { key: 'note', label: 'Note' },
    ],
    [{ name: 'Van-05', note: 'Depot "A", north\nshift' }]
  );

  assert.equal(csv, 'Name,Note\nVan-05,"Depot ""A"", north\nshift"');
});

test('buildSimplePdf returns a PDF document buffer', () => {
  const pdf = buildSimplePdf('TransitOps', ['Fleet utilization: 75%']);

  assert.equal(Buffer.isBuffer(pdf), true);
  assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4');
  assert.match(pdf.toString(), /%%EOF$/);
});
