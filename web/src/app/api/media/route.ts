import { NextRequest, NextResponse } from 'next/server';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
  thumbnail?: string;
  source: 'instagram' | 'tiktok' | 'youtube' | 'direct' | 'other';
}

export interface UniversalApiResponse {
  success: boolean;
  platform: string;
  title?: string;
  author?: string;
  media: MediaItem[];
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Masukkan URL yang valid.' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // =========================================================================
    // 1. YOUTUBE (Video & Shorts HD Thumbnails & Title via Official OEMBED)
    // =========================================================================
    const ytMatch = trimmedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      let title = 'YouTube Video';
      let author = 'YouTube Creator';

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
          next: { revalidate: 3600 },
        });
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title || title;
          author = oembedData.author_name || author;
        }
      } catch (err) {
        console.warn('YouTube OEMBED fetch error:', err);
      }

      const media: MediaItem[] = [
        {
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          title: `${title} (Resolusi Tertinggi / HD)`,
          type: 'image',
          source: 'youtube',
        },
        {
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          title: `${title} (Kualitas Standar HQ)`,
          type: 'image',
          source: 'youtube',
        },
      ];

      return NextResponse.json({
        success: true,
        platform: 'YouTube',
        title,
        author,
        media,
      });
    }

    // =========================================================================
    // 2. TIKTOK (Official OEMBED for TikTok Posts)
    // =========================================================================
    if (trimmedUrl.includes('tiktok.com')) {
      try {
        const ttRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmedUrl)}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          next: { revalidate: 3600 },
        });

        if (ttRes.ok) {
          const data = await ttRes.json();
          const thumbnailUrl = data.thumbnail_url || '';
          return NextResponse.json({
            success: true,
            platform: 'TikTok',
            title: data.title || 'Postingan TikTok',
            author: data.author_name || 'TikTok Creator',
            media: thumbnailUrl
              ? [
                  {
                    url: thumbnailUrl,
                    thumbnail: thumbnailUrl,
                    title: data.title || 'TikTok Cover / Thumbnail HD',
                    type: 'image',
                    source: 'tiktok',
                  },
                ]
              : [],
          });
        }
      } catch (err) {
        console.warn('TikTok fetch error:', err);
      }
    }

    // =========================================================================
    // 3. INSTAGRAM (Public Embed & OpenGraph Fallback)
    // =========================================================================
    const igMatch = trimmedUrl.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (igMatch && igMatch[1]) {
      const shortcode = igMatch[1];
      const mediaList: MediaItem[] = [];
      let author = 'Instagram User';
      let title = 'Postingan Instagram';

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
          const authorMatch = html.match(/class="UsernameText"[^>]*>([^<]+)<\/span>/);
          if (authorMatch && authorMatch[1]) author = authorMatch[1].trim();

          const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
          if (imgMatch && imgMatch[1]) {
            const rawUrl = imgMatch[1].replace(/&amp;/g, '&');
            mediaList.push({
              url: rawUrl,
              type: 'image',
              thumbnail: rawUrl,
              title: `Foto Instagram (@${author})`,
              source: 'instagram',
            });
          }

          const captionMatch = html.match(/class="Caption"[^>]*>[\s\S]*?<br \/>([\s\S]*?)<\/div>/);
          if (captionMatch && captionMatch[1]) {
            title = captionMatch[1].replace(/<[^>]+>/g, '').trim();
          }
        }
      } catch (e) {
        console.warn('IG Embed failed, fallback to direct:', e);
      }

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
                title: `Foto Instagram (@${author})`,
                source: 'instagram',
              });
            }
          }
        } catch (e) {
          console.warn('IG Direct fetch failed:', e);
        }
      }

      if (mediaList.length > 0) {
        return NextResponse.json({
          success: true,
          platform: 'Instagram',
          title,
          author,
          media: mediaList,
        });
      }
    }

    // =========================================================================
    // 4. DIRECT IMAGE OR MEDIA URL (JPG, PNG, WEBP, GIF, MP4)
    // =========================================================================
    if (trimmedUrl.match(/\.(jpeg|jpg|png|webp|gif|svg|mp4|webm)(\?.*)?$/i)) {
      const isVideo = trimmedUrl.match(/\.(mp4|webm)(\?.*)?$/i);
      const filename = trimmedUrl.split('/').pop()?.split('?')[0] || 'media_file';
      return NextResponse.json({
        success: true,
        platform: 'Direct URL',
        title: filename,
        author: 'Web Resource',
        media: [
          {
            url: trimmedUrl,
            thumbnail: isVideo ? undefined : trimmedUrl,
            title: filename,
            type: isVideo ? 'video' : 'image',
            source: 'direct',
          },
        ],
      });
    }

    // If none matched, try generic OpenGraph fetch for image
    try {
      const pageRes = await fetch(trimmedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      if (pageRes.ok) {
        const pageHtml = await pageRes.text();
        const ogImage = pageHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
        const ogTitle = pageHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] || 'Media Eksternal';

        if (ogImage) {
          const rawUrl = ogImage.replace(/&amp;/g, '&');
          return NextResponse.json({
            success: true,
            platform: 'Web Media',
            title: ogTitle,
            author: 'Web Source',
            media: [
              {
                url: rawUrl,
                thumbnail: rawUrl,
                title: ogTitle,
                type: 'image',
                source: 'other',
              },
            ],
          });
        }
      }
    } catch (e) {
      console.warn('Generic OG fetch failed:', e);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Media tidak dapat ditemukan. Pastikan tautan berasal dari postingan publik Instagram, YouTube, TikTok, atau link file gambar langsung (.jpg, .png, .webp).',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Media Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat mengambil media.' },
      { status: 500 }
    );
  }
}
