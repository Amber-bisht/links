export function encodeLink(url: string): string {
  try {
    // Simple Base64 encoding with URL-safe replacements
    const base64 = Buffer.from(url).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Error encoding link:', e);
    return '';
  }
}

export function decodeLink(slug: string): string {
  try {
    // Reverse URL-safe replacements and decode Base64
    let base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Error decoding link:', e);
    return '';
  }
}
