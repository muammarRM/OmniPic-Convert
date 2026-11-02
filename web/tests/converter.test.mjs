import test from 'node:test';
import assert from 'node:assert';
import {
  formatBytes,
  calculateDimensions,
  PRESET_DIMENSIONS,
  isHumanSkinTone,
  applyBackgroundColor,
} from '../src/lib/converter.ts';

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

test('isHumanSkinTone correctly identifies human skin tones across ethnicities', () => {
  // Fair skin (Fitzpatrick I-II)
  assert.strictEqual(isHumanSkinTone(255, 224, 189), true, 'Fair skin should be detected');
  // Olive / Asian skin (Fitzpatrick III)
  assert.strictEqual(isHumanSkinTone(225, 172, 120), true, 'Asian/olive skin should be detected');
  // Indonesian / Tan skin (Fitzpatrick IV)
  assert.strictEqual(isHumanSkinTone(198, 134, 66), true, 'Tan/Indonesian skin should be detected');
  // Dark brown skin (Fitzpatrick V)
  assert.strictEqual(isHumanSkinTone(141, 85, 36), true, 'Dark brown skin should be detected');
  // Deep melanin skin (Fitzpatrick VI)
  assert.strictEqual(isHumanSkinTone(90, 50, 25), true, 'Deep melanin skin should be detected');
});

test('isHumanSkinTone rejects non-skin colors to allow clean background replacement', () => {
  // White wall
  assert.strictEqual(isHumanSkinTone(255, 255, 255), false, 'White should not be skin');
  // Off-white / light gray wall
  assert.strictEqual(isHumanSkinTone(220, 220, 220), false, 'Gray should not be skin');
  // CPNS Official Red background (#D32F2F)
  assert.strictEqual(isHumanSkinTone(211, 47, 47), false, 'CPNS Red should not be skin');
  // CPNS Official Blue background (#1565C0)
  assert.strictEqual(isHumanSkinTone(21, 101, 192), false, 'CPNS Blue should not be skin');
  // Pure blue wall
  assert.strictEqual(isHumanSkinTone(0, 0, 255), false, 'Blue should not be skin');
  // Green wall
  assert.strictEqual(isHumanSkinTone(46, 125, 50), false, 'Green should not be skin');
  // Black suit
  assert.strictEqual(isHumanSkinTone(20, 20, 20), false, 'Black suit should not be skin');
});

test('applyBackgroundColor replaces perimeter wall background with CPNS Blue while preserving human skin pixels', () => {
  const width = 10;
  const height = 10;
  const data = new Uint8ClampedArray(width * height * 4);

  // Initialize canvas:
  // Perimeter (y=0 or y=9 or x=0 or x=9) = white wall (255, 255, 255, 255)
  // Center (x: 4..6, y: 4..6) = Indonesian skin tone (198, 134, 66, 255)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (x >= 4 && x <= 6 && y >= 4 && y <= 6) {
        data[idx] = 198;
        data[idx + 1] = 134;
        data[idx + 2] = 66;
        data[idx + 3] = 255;
      } else {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  }

  let updatedData = data;
  const mockCtx = {
    getImageData: () => ({ data: updatedData }),
    putImageData: (imgData) => {
      updatedData = imgData.data;
    },
  };

  applyBackgroundColor(mockCtx, width, height, 'blue');

  // Verify top-left corner (0,0) was replaced with CPNS official blue (#1565C0: [21, 101, 192])
  assert.strictEqual(updatedData[0], 21, 'R of wall pixel should be CPNS Blue (21)');
  assert.strictEqual(updatedData[1], 101, 'G of wall pixel should be CPNS Blue (101)');
  assert.strictEqual(updatedData[2], 192, 'B of wall pixel should be CPNS Blue (192)');

  // Verify center skin pixel (5, 5) remained UNTOUCHED
  const skinIdx = (5 * width + 5) * 4;
  assert.strictEqual(updatedData[skinIdx], 198, 'Skin pixel R should remain 198');
  assert.strictEqual(updatedData[skinIdx + 1], 134, 'Skin pixel G should remain 134');
  assert.strictEqual(updatedData[skinIdx + 2], 66, 'Skin pixel B should remain 66');
});
