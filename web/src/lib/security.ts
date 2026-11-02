/**
 * Security utilities for OmniPic-Convert
 * Validates public HTTP/HTTPS URLs and blocks SSRF (private IPs, localhost, cloud metadata).
 */

export function isValidPublicHttpUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, .local, internal domains
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Block IPv4 private/loopback/link-local addresses
    if (
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') || // Cloud metadata (AWS, GCP, Azure, etc.)
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    // Block IPv6 loopback and private
    if (
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fe80:')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
