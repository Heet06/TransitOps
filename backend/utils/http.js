function sendDbError(res, err) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this unique value already exists' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'This record is referenced by other records' });
  }
  if (err.code === '23514' || err.code === 'P0001') {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowsToCsv(headers, rows) {
  return [
    headers.map((header) => csvEscape(header.label)).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header.key])).join(',')),
  ].join('\n');
}

function buildSimplePdf(title, lines) {
  const objects = [];
  const safe = (value) => String(value ?? '').replace(/[()\\]/g, '\\$&');
  const content = [
    'BT',
    '/F1 18 Tf',
    '50 780 Td',
    `(${safe(title)}) Tj`,
    '/F1 10 Tf',
    '0 -24 Td',
    ...lines.flatMap((line) => [`(${safe(line).slice(0, 105)}) Tj`, '0 -14 Td']),
    'ET',
  ].join('\n');

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

module.exports = { sendDbError, rowsToCsv, buildSimplePdf };
