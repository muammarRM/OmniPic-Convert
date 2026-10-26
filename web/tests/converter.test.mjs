import test from 'node:test';
import assert from 'node:assert';
import { formatBytes, calculateDimensions, PRESET_DIMENSIONS } from '../src/lib/converter.ts';

test('formatBytes formats file sizes correctly', () => {
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(1024), '1 KB');
  assert.strictEqual(formatBytes(1024 * 1024), '1 MB');
  assert.strictEqual(formatBytes(200 * 1024), '200 KB');
});

test('calculateDimensions preserves original size when preset is original', () => {
  const result = calculateDimensions(1920, 1080, {
    outputFormat: 'image/jpeg',
    quality: 0.85,
    resizePreset: 'original',
  });
  assert.deepStrictEqual(result, { width: 1920, height: 1080 });
});

test('calculateDimensions calculates Pas Foto 3x4 correctly', () => {
  const result = calculateDimensions(1920, 1080, {
    outputFormat: 'image/jpeg',
    quality: 0.85,
    resizePreset: '3x4',
  });
  assert.deepStrictEqual(result, {
    width: PRESET_DIMENSIONS['3x4'].width,
    height: PRESET_DIMENSIONS['3x4'].height,
  });
});

test('calculateDimensions maintains aspect ratio for custom size', () => {
  const result = calculateDimensions(1000, 500, {
    outputFormat: 'image/jpeg',
    quality: 0.85,
    resizePreset: 'custom',
    customWidth: 500,
    maintainAspectRatio: true,
  });
  assert.deepStrictEqual(result, { width: 500, height: 250 });
});

test('calculateDimensions calculates Pas Foto 4x6 and KTP correctly', () => {
  const r4x6 = calculateDimensions(1920, 1080, {
    outputFormat: 'image/jpeg',
    quality: 0.85,
    resizePreset: '4x6',
  });
  assert.deepStrictEqual(r4x6, {
    width: PRESET_DIMENSIONS['4x6'].width,
    height: PRESET_DIMENSIONS['4x6'].height,
  });

  const rKtp = calculateDimensions(1920, 1080, {
    outputFormat: 'image/jpeg',
    quality: 0.85,
    resizePreset: 'ktp',
  });
  assert.deepStrictEqual(rKtp, {
    width: PRESET_DIMENSIONS['ktp'].width,
    height: PRESET_DIMENSIONS['ktp'].height,
  });
});
