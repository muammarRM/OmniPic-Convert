import { NextRequest, NextResponse } from 'next/server';

interface InstagramMediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface InstagramApiResponse {
  success: boolean;
  shortcode?: string;
  caption?: string;
  author?: string;
  media: InstagramMediaItem[];
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL Instagram tidak valid.' }, { status: 400 });
    }

    // Extract shortcode from Instagram URL
    // Examples: https://www.instagram.com/p/DB1234abc/ or /reel/DB1234abc/
    const match = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!match || !match[1]) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format link tidak dikenali. Masukkan link postingan atau reels Instagram publik (contoh: https://www.instagram.com/p/XXXX/).',
        },
        { status: 400 }
      );
    }

    const shortcode = match[1];
    const mediaList: InstagramMediaItem[] = [];
    let author = 'Instagram User';
    let caption = '';

    // Approach 1: Public Embed Endpoint (very reliable for public posts, no login required)
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
    try {
      const embedRes = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 60 },
      });

      if (embedRes.ok) {
        const html = await embedRes.text();

        // Extract author
        const authorMatch = html.match(/class="UsernameText"[^>]*>([^<]+)<\/span>/);
        if (authorMatch && authorMatch[1]) {
          author = authorMatch[1].trim();
        }

        // Extract main image url from EmbeddedMediaImage
        const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
        if (imgMatch && imgMatch[1]) {
          const rawUrl = imgMatch[1].replace(/&amp;/g, '&');
          mediaList.push({
            url: rawUrl,
            type: 'image',
            thumbnail: rawUrl,
          });
        }

        // Extract caption if present
        const captionMatch = html.match(/class="Caption"[^>]*>[\s\S]*?<br \/>([\s\S]*?)<\/div>/);
        if (captionMatch && captionMatch[1]) {
          caption = captionMatch[1].replace(/<[^>]+>/g, '').trim();
        }
      }
    } catch (e) {
      console.warn('Embed fetch attempt failed, trying fallback:', e);
    }

    // Approach 2: If embed didn't catch media, try direct page OpenGraph tags
    if (mediaList.length === 0) {
      try {
        const directUrl = `https://www.instagram.com/p/${shortcode}/`;
        const directRes = await fetch(directUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            Accept: 'text/html',
          },
        });

        if (directRes.ok) {
          const directHtml = await directRes.text();
          const ogImageMatch = directHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
          if (ogImageMatch && ogImageMatch[1]) {
            const rawUrl = ogImageMatch[1].replace(/&amp;/g, '&');
            mediaList.push({
              url: rawUrl,
              type: 'image',
              thumbnail: rawUrl,
            });
          }

          const ogTitleMatch = directHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
          if (ogTitleMatch && ogTitleMatch[1]) {
            caption = ogTitleMatch[1];
          }
        }
      } catch (e) {
        console.warn('Direct fetch failed:', e);
      }
    }

    if (mediaList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Gagal mengambil media. Pastikan akun Instagram bersifat PUBLIK (bukan private) dan link valid.',
        },
        { status: 404 }
      );
    }

    const response: InstagramApiResponse = {
      success: true,
      shortcode,
      author,
      caption,
      media: mediaList,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan server saat memproses permintaan Instagram: ' + String(error),
      },
      { status: 500 }
    );
  }
}
