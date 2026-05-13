import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an HTML string to prevent XSS attacks while preserving safe formatting.
 * 
 * @param html The raw HTML string to sanitize
 * @returns A safe HTML string
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'class', 'style'],
    // Ensure links open in new tab securely if they are external
    ADD_ATTR: ['target'],
  });
}
