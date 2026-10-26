import test from 'node:test';
import assert from 'node:assert';
import { createMultiPagePdf } from '../src/lib/pdfGenerator.ts';

test('createMultiPagePdf generates valid PDF with correct magic bytes and trailer', async () => {
  const dummyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const blob = createMultiPagePdf([
    { jpegBytes: dummyJpeg, width: 800, height: 600 },
    { jpegBytes: dummyJpeg, width: 1024, height: 768 },
  ]);

  assert.strictEqual(blob.type, 'application/pdf');
  const buffer = Buffer.from(await blob.arrayBuffer());
  const text = buffer.toString('binary');

  assert.ok(text.startsWith('%PDF-1.4'), 'Should start with %PDF-1.4');
  assert.ok(text.includes('/Type /Catalog'), 'Should contain Catalog');
  assert.ok(text.includes('/Count 2'), 'Should contain 2 pages');
  assert.ok(text.trim().endsWith('%%EOF'), 'Should end with %%EOF');
});
