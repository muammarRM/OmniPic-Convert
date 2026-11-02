import { NextRequest, NextResponse } from 'next/server';
import { isValidPublicHttpUrl } from '@/lib/security';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url || !isValidPublicHttpUrl(url)) {
    return new NextResponse('URL parameter is required, must be HTTP/HTTPS, and cannot point to internal/local addresses.', {
      status: 400,
    });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://www.instagram.com/',
      },
      signal: AbortSignal.timeout(8000), // 8 seconds timeout
    });

    if (!res.ok) {
      return new NextResponse(`Gagal mengambil media dari server asal (Status: ${res.status})`, {
        status: res.status,
      });
    }

    // Limit maximum size to 25MB to prevent serverless OOM crash
    const contentLength = Number(res.headers.get('content-length'));
    if (contentLength && contentLength > 25 * 1024 * 1024) {
      return new NextResponse('Ukuran media melebihi batas maksimal proksi (25 MB).', {
        status: 413,
      });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    const message = isTimeout
      ? 'Koneksi ke server media asal melebihi batas waktu (timeout).'
      : 'Kendala proksi: ' + (error instanceof Error ? error.message : String(error));

    return new NextResponse(message, { status: isTimeout ? 504 : 502 });
  }
}
