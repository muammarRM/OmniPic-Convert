// Client-side image converter and compressor engine for OmniPic-Convert

export interface ConvertOptions {
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  quality: number; // 0.1 to 1.0 (default 0.85)
  targetSizeKb?: number; // e.g. 200 for <= 200 KB
  resizePreset?: 'original' | '2x3' | '3x4' | '4x6' | 'ktp' | 'custom';
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio?: boolean;
  rotation?: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  filter?: 'none' | 'grayscale' | 'contrast' | 'bright' | 'sepia' | 'scanner';
  watermarkText?: string;
  bgColor?: 'none' | 'red' | 'blue' | 'white';
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
 * Render image onto a canvas with target dimensions, rotation, filters, and watermark
 */
function renderToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  options?: ConvertOptions
): HTMLCanvasElement {
  const rotation = options?.rotation || 0;
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const canvasW = isRotated90or270 ? height : width;
  const canvasH = isRotated90or270 ? width : height;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill with white background for transparency in JPEG or clean borders
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();

  // Apply filters
  const filter = options?.filter || 'none';
  if (filter === 'grayscale') {
    ctx.filter = 'grayscale(100%)';
  } else if (filter === 'contrast') {
    ctx.filter = 'contrast(150%) brightness(105%)';
  } else if (filter === 'bright') {
    ctx.filter = 'brightness(125%)';
  } else if (filter === 'sepia') {
    ctx.filter = 'sepia(100%)';
  } else if (filter === 'scanner') {
    ctx.filter = 'contrast(180%) brightness(115%) grayscale(80%)';
  }

  // Move origin to center for rotation/flip
  ctx.translate(canvasW / 2, canvasH / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  const flipH = options?.flipHorizontal ?? false;
  const flipV = options?.flipVertical ?? false;
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Smooth resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();

  // Background color replacement (Merah / Biru Pas Foto Resmi)
  const bgColor = options?.bgColor;
  if (bgColor && bgColor !== 'none') {
    const targetRgb =
      bgColor === 'red'
        ? [211, 47, 47] // #D32F2F (Merah Resmi CPNS)
        : bgColor === 'blue'
        ? [21, 101, 192] // #1565C0 (Biru Resmi CPNS)
        : [255, 255, 255]; // Putih

    try {
      const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
      const data = imgData.data;

      // Sample 4 corners to detect outer wall/background
      const corners = [
        0,
        Math.max(0, (canvasW - 1) * 4),
        Math.max(0, (canvasH - 1) * canvasW * 4),
        Math.max(0, ((canvasH - 1) * canvasW + (canvasW - 1)) * 4),
      ];

      let sampleR = 0;
      let sampleG = 0;
      let sampleB = 0;
      for (const idx of corners) {
        sampleR += data[idx] || 255;
        sampleG += data[idx + 1] || 255;
        sampleB += data[idx + 2] || 255;
      }
      sampleR = Math.round(sampleR / 4);
      sampleG = Math.round(sampleG / 4);
      sampleB = Math.round(sampleB / 4);

      const tolerance = 48;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) {
          data[i] = targetRgb[0];
          data[i + 1] = targetRgb[1];
          data[i + 2] = targetRgb[2];
          data[i + 3] = 255;
        } else {
          const diff = Math.sqrt(
            Math.pow(r - sampleR, 2) + Math.pow(g - sampleG, 2) + Math.pow(b - sampleB, 2)
          );
          if (diff <= tolerance) {
            data[i] = targetRgb[0];
            data[i + 1] = targetRgb[1];
            data[i + 2] = targetRgb[2];
            data[i + 3] = 255;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Background color replacement failed:', e);
    }
  }

  // Watermark text if provided
  if (options?.watermarkText && options.watermarkText.trim()) {
    ctx.save();
    const fontSize = Math.max(14, Math.round(canvasW / 28));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    const padding = Math.max(12, Math.round(canvasW / 40));
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(options.watermarkText.trim(), canvasW - padding, canvasH - padding);
    ctx.restore();
  }

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
    let canvas = renderToCanvas(img, width, height, options);

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
        canvas = renderToCanvas(img, scaledW, scaledH, options);
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
    const canvas = renderToCanvas(img, width, height, options);
    finalBlob = await canvasToBlob(canvas, targetMime, options.quality);
  }

  // Adjust final dimensions if rotated 90 or 270 degrees
  const rot = options.rotation || 0;
  if (rot === 90 || rot === 270) {
    const temp = finalWidth;
    finalWidth = finalHeight;
    finalHeight = temp;
  }

  // If output is PDF, encapsulate the JPEG bytes into a standard compliant PDF 1.4 document
  if (options.outputFormat === 'application/pdf') {
    const { createMultiPagePdf } = await import('./pdfGenerator');
    const arrayBuffer = await finalBlob.arrayBuffer();
    finalBlob = createMultiPagePdf([
      {
        jpegBytes: new Uint8Array(arrayBuffer),
        width: finalWidth,
        height: finalHeight,
      },
    ]);
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
