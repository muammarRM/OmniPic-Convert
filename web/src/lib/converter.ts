// Client-side image converter and compressor engine for OmniPic-Convert

export interface ConvertOptions {
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  quality: number; // 0.1 to 1.0 (default 0.85)
  targetSizeKb?: number; // e.g. 200 for <= 200 KB
  resizePreset?: 'original' | '2x3' | '3x4' | '4x6' | 'ktp' | 'custom';
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio?: boolean;
}

export interface ConvertResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
  outputFormat: string;
  filename: string;
}

export const PRESET_DIMENSIONS: Record<string, { width: number; height: number; label: string; desc: string }> = {
  original: { width: 0, height: 0, label: 'Asli', desc: 'Ukuran original tanpa perubahan' },
  '2x3': { width: 236, height: 354, label: 'Pas Foto 2x3', desc: '2.16 x 2.79 cm (300 DPI)' },
  '3x4': { width: 354, height: 472, label: 'Pas Foto 3x4', desc: '2.79 x 3.81 cm (300 DPI)' },
  '4x6': { width: 472, height: 709, label: 'Pas Foto 4x6', desc: '3.81 x 5.59 cm (300 DPI)' },
  ktp: { width: 1011, height: 638, label: 'Standar KTP', desc: '85.6 x 53.98 mm (300 DPI)' },
  custom: { width: 0, height: 0, label: 'Custom', desc: 'Tentukan lebar & tinggi sendiri' },
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
}

/**
 * Converts HEIC/HEIF file to JPEG blob using client-side heic2any
 */
export async function convertHeicToBlob(file: File): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('Client-only');
  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

/**
 * Loads an Image object from a Blob or File
 */
export function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat gambar: ' + err));
    };
    img.src = url;
  });
}

/**
 * Calculates target dimensions based on preset or custom options
 */
export function calculateDimensions(
  origW: number,
  origH: number,
  options: ConvertOptions
): { width: number; height: number } {
  const { resizePreset = 'original', customWidth, customHeight, maintainAspectRatio = true } = options;

  if (resizePreset === 'original' || (!resizePreset && !customWidth && !customHeight)) {
    return { width: origW, height: origH };
  }

  if (resizePreset in PRESET_DIMENSIONS && resizePreset !== 'custom') {
    return {
      width: PRESET_DIMENSIONS[resizePreset].width,
      height: PRESET_DIMENSIONS[resizePreset].height,
    };
  }

  if (resizePreset === 'custom' || customWidth || customHeight) {
    let targetW = customWidth || origW;
    let targetH = customHeight || origH;

    if (maintainAspectRatio) {
      if (customWidth && !customHeight) {
        targetH = Math.round((origH / origW) * customWidth);
      } else if (!customWidth && customHeight) {
        targetW = Math.round((origW / origH) * customHeight);
      } else if (customWidth && customHeight) {
        // Fit within bounding box
        const ratio = Math.min(customWidth / origW, customHeight / origH);
        targetW = Math.round(origW * ratio);
        targetH = Math.round(origH * ratio);
      }
    }

    return {
      width: Math.max(1, targetW),
      height: Math.max(1, targetH),
    };
  }

  return { width: origW, height: origH };
}

/**
 * Render image onto a canvas with target dimensions
 */
function renderToCanvas(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill with white background for transparency in JPEG or clean borders
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Smooth resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Exports canvas to Blob with specified mime and quality
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal mengekspor canvas ke Blob'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Core image conversion & compression engine with Target KB binary search
 */
export async function processImage(file: File, options: ConvertOptions): Promise<ConvertResult> {
  // Step 1: Normalize HEIC/HEIF to Blob if needed
  let sourceBlob: Blob = file;
  if (isHeicFile(file)) {
    sourceBlob = await convertHeicToBlob(file);
  }

  const originalSize = file.size;
  const img = await loadImage(sourceBlob);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Step 2: Determine initial dimensions
  const { width, height } = calculateDimensions(origW, origH, options);

  const targetMime = options.outputFormat === 'application/pdf' ? 'image/jpeg' : options.outputFormat;

  let finalBlob: Blob;
  let finalWidth = width;
  let finalHeight = height;

  // Step 3: Handle Target KB Mode vs Standard Quality Mode
  if (options.targetSizeKb && options.targetSizeKb > 0 && targetMime !== 'image/png') {
    const targetBytes = options.targetSizeKb * 1024;
    let canvas = renderToCanvas(img, width, height);

    // Binary search for quality [0.05 .. 0.95]
    let lowQ = 0.05;
    let highQ = 0.95;
    let bestBlob: Blob | null = null;

    for (let iter = 0; iter < 7; iter++) {
      const midQ = (lowQ + highQ) / 2;
      const testBlob = await canvasToBlob(canvas, targetMime, midQ);

      if (testBlob.size <= targetBytes) {
        bestBlob = testBlob;
        // Try higher quality to get as close as possible to target without exceeding
        lowQ = midQ;
      } else {
        highQ = midQ;
      }
    }

    // If even lowest quality exceeds targetBytes, downscale dimensions
    if (!bestBlob || bestBlob.size > targetBytes) {
      let currentScale = 0.9;
      while (currentScale > 0.1) {
        const scaledW = Math.max(50, Math.round(width * currentScale));
        const scaledH = Math.max(50, Math.round(height * currentScale));
        canvas = renderToCanvas(img, scaledW, scaledH);
        const testBlob = await canvasToBlob(canvas, targetMime, 0.15);
        if (testBlob.size <= targetBytes) {
          bestBlob = testBlob;
          finalWidth = scaledW;
          finalHeight = scaledH;
          break;
        }
        currentScale -= 0.15;
      }
    }

    finalBlob = bestBlob || (await canvasToBlob(canvas, targetMime, 0.05));
  } else {
    // Standard quality conversion
    const canvas = renderToCanvas(img, width, height);
    finalBlob = await canvasToBlob(canvas, targetMime, options.quality);
  }

  // Generate output filename
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  let ext = 'jpg';
  if (options.outputFormat === 'image/png') ext = 'png';
  else if (options.outputFormat === 'image/webp') ext = 'webp';
  else if (options.outputFormat === 'application/pdf') ext = 'pdf';

  const filename = `${baseName}_omnipic.${ext}`;
  const dataUrl = URL.createObjectURL(finalBlob);

  return {
    blob: finalBlob,
    dataUrl,
    originalSize,
    compressedSize: finalBlob.size,
    originalDimensions: { width: origW, height: origH },
    newDimensions: { width: finalWidth, height: finalHeight },
    outputFormat: options.outputFormat,
    filename,
  };
}
