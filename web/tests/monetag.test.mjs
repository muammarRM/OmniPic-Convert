import test from 'node:test';
import assert from 'node:assert';
import { MONETAG_DIRECT_LINKS, getMonetagDirectLink } from '../src/lib/monetag.ts';

test('MONETAG_DIRECT_LINKS contains 4 fresh active zones', () => {
  assert.strictEqual(MONETAG_DIRECT_LINKS.length, 4);
  assert.strictEqual(MONETAG_DIRECT_LINKS[0], 'https://uplcm.com/4/12131009');
  assert.strictEqual(MONETAG_DIRECT_LINKS[1], 'https://uplcm.com/4/12131018');
  assert.strictEqual(MONETAG_DIRECT_LINKS[2], 'https://uplcm.com/4/12131019');
  assert.strictEqual(MONETAG_DIRECT_LINKS[3], 'https://uplcm.com/4/12131021');
});

test('getMonetagDirectLink returns valid url from pool', () => {
  const url = getMonetagDirectLink();
  assert.ok(MONETAG_DIRECT_LINKS.includes(url));
});
