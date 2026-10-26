// Monetag Direct SmartLink Pool & Rotator for OmniPic-Convert
// Distributes traffic evenly across fresh zones to maximize fill rate,
// avoid IP frequency capping, and prevent redirect fallbacks.

export const MONETAG_DIRECT_LINKS: readonly string[] = [
  'https://uplcm.com/4/12131009',
  'https://uplcm.com/4/12131018',
  'https://uplcm.com/4/12131019',
  'https://uplcm.com/4/12131021',
];

let globalRotatorIndex = 0;

/**
 * Returns an active Monetag Direct Link rotating through the pool
 */
export function getMonetagDirectLink(): string {
  if (typeof window === 'undefined') {
    return MONETAG_DIRECT_LINKS[0];
  }

  // Pick round-robin and advance index
  const selected = MONETAG_DIRECT_LINKS[globalRotatorIndex % MONETAG_DIRECT_LINKS.length];
  globalRotatorIndex = (globalRotatorIndex + 1) % MONETAG_DIRECT_LINKS.length;
  return selected;
}
