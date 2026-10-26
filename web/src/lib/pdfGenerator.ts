// Pure client-side zero-dependency multi-page PDF generator for OmniPic
// Embeds JPEG/PNG images directly into compliant PDF 1.4 documents.

interface PdfPageImage {
  jpegBytes: Uint8Array;
  width: number;
  height: number;
}

/**
 * Creates a valid multi-page PDF document from an array of image bytes.
 */
export function createMultiPagePdf(pages: PdfPageImage[]): Blob {
  const chunks: (string | Uint8Array)[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  function pushString(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    byteOffset += bytes.length;
  }

  function pushBytes(bytes: Uint8Array) {
    chunks.push(bytes);
    byteOffset += bytes.length;
  }

  // Header
  pushString('%PDF-1.4\n%âãÏÓ\n');

  const totalPages = pages.length;
  // Object IDs:
  // 1: Catalog
  // 2: Pages root
  // For each page i (0-based):
  //   Page obj: 3 + i * 3
  //   Content obj: 4 + i * 3
  //   Image XObject: 5 + i * 3

  const kids: string[] = [];
  for (let i = 0; i < totalPages; i++) {
    kids.push(`${3 + i * 3} 0 R`);
  }

  // Obj 1: Catalog
  offsets.push(byteOffset);
  pushString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages root
  offsets.push(byteOffset);
  pushString(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${totalPages} >>\nendobj\n`);

  // Generate each page
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imgObjId = 5 + i * 3;

    // Standard 72 DPI point coordinate system
    // Scale image dimensions to points (max 595 x 842 for A4 or proportional)
    const maxWidth = 595; // A4 width in pt
    const maxHeight = 842; // A4 height in pt
    const scale = Math.min(maxWidth / page.width, maxHeight / page.height, 1);
    const ptWidth = Math.round(page.width * scale);
    const ptHeight = Math.round(page.height * scale);

    // Page object
    offsets.push(byteOffset);
    pushString(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Resources << /XObject << /Im${i + 1} ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content stream (draws image to fit the page)
    const contentStream = `q\n${ptWidth} 0 0 ${ptHeight} 0 0 cm\n/Im${i + 1} Do\nQ\n`;
    offsets.push(byteOffset);
    pushString(
      `${contentObjId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
    );

    // Image XObject with /DCTDecode (JPEG)
    offsets.push(byteOffset);
    pushString(
      `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(page.jpegBytes);
    pushString('\nendstream\nendobj\n');
  }

  // Cross-reference table (XRef)
  const xrefOffset = byteOffset;
  const totalObjects = 2 + totalPages * 3;
  pushString(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    pushString(`${String(offset).padStart(10, '0')} 00000 n \n`);
  }

  // Trailer
  pushString(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
}
