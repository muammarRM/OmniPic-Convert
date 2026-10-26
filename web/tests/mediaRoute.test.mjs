import test from 'node:test';
import assert from 'node:assert';

// Extract pattern matching logic as tested in /api/media
function parseMediaUrl(url) {
  const trimmedUrl = url.trim();

  // YouTube
  const ytMatch = trimmedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      platform: 'YouTube',
      id: ytMatch[1],
      maxResThumb: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
    };
  }

  // Instagram
  const igMatch = trimmedUrl.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (igMatch && igMatch[1]) {
    return {
      platform: 'Instagram',
      shortcode: igMatch[1],
      embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed/captioned/`,
    };
  }

  // TikTok
  if (trimmedUrl.includes('tiktok.com')) {
    return {
      platform: 'TikTok',
      url: trimmedUrl,
    };
  }

  // Direct media
  if (trimmedUrl.match(/\.(jpeg|jpg|png|webp|gif|svg|mp4|webm)(\?.*)?$/i)) {
    return {
      platform: 'Direct URL',
      url: trimmedUrl,
    };
  }

  return { platform: 'Unknown' };
}

test('parseMediaUrl extracts YouTube standard video ID', () => {
  const res = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.strictEqual(res.platform, 'YouTube');
  assert.strictEqual(res.id, 'dQw4w9WgXcQ');
  assert.strictEqual(res.maxResThumb, 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
});

test('parseMediaUrl extracts YouTube Shorts ID', () => {
  const res = parseMediaUrl('https://youtube.com/shorts/3H2j1k9Lp0a?si=abcdef');
  assert.strictEqual(res.platform, 'YouTube');
  assert.strictEqual(res.id, '3H2j1k9Lp0a');
});

test('parseMediaUrl extracts Instagram post and reels shortcodes', () => {
  const postRes = parseMediaUrl('https://www.instagram.com/p/DB1234abc/');
  assert.strictEqual(postRes.platform, 'Instagram');
  assert.strictEqual(postRes.shortcode, 'DB1234abc');

  const reelRes = parseMediaUrl('https://www.instagram.com/reel/C7xyz987_0/');
  assert.strictEqual(reelRes.platform, 'Instagram');
  assert.strictEqual(reelRes.shortcode, 'C7xyz987_0');
});

test('parseMediaUrl handles TikTok links', () => {
  const ttRes = parseMediaUrl('https://www.tiktok.com/@creator/video/1234567890123456789');
  assert.strictEqual(ttRes.platform, 'TikTok');
});

test('parseMediaUrl handles direct images and videos', () => {
  const imgRes = parseMediaUrl('https://example.com/assets/sample.webp?v=1');
  assert.strictEqual(imgRes.platform, 'Direct URL');
});
