import test from 'node:test';
import assert from 'node:assert';
import { isValidPublicHttpUrl } from '../src/lib/security.ts';

test('isValidPublicHttpUrl approves valid public HTTP and HTTPS URLs', () => {
  assert.strictEqual(isValidPublicHttpUrl('https://instagram.com/p/DB123/'), true);
  assert.strictEqual(isValidPublicHttpUrl('http://example.com/photo.jpg'), true);
  assert.strictEqual(isValidPublicHttpUrl('https://img.youtube.com/vi/123/maxresdefault.jpg'), true);
});

test('isValidPublicHttpUrl rejects SSRF and internal addresses', () => {
  assert.strictEqual(isValidPublicHttpUrl('http://localhost:3000/api'), false);
  assert.strictEqual(isValidPublicHttpUrl('http://127.0.0.1/admin'), false);
  assert.strictEqual(isValidPublicHttpUrl('http://169.254.169.254/latest/meta-data/'), false);
  assert.strictEqual(isValidPublicHttpUrl('http://192.168.1.1/secret'), false);
  assert.strictEqual(isValidPublicHttpUrl('http://10.0.0.1/db'), false);
  assert.strictEqual(isValidPublicHttpUrl('http://172.16.0.1/internal'), false);
});

test('isValidPublicHttpUrl rejects invalid schemes and malformed strings', () => {
  assert.strictEqual(isValidPublicHttpUrl('file:///etc/passwd'), false);
  assert.strictEqual(isValidPublicHttpUrl('javascript:alert(1)'), false);
  assert.strictEqual(isValidPublicHttpUrl('ftp://ftp.example.com'), false);
  assert.strictEqual(isValidPublicHttpUrl(''), false);
  assert.strictEqual(isValidPublicHttpUrl('not a url'), false);
});
