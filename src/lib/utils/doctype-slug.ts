export const doctypeExceptions: Record<string, string> = {
  "todo": "ToDo",
  "awss3-settings": "AWSS3 Settings",
  "doctype": "DocType",
};

export function slugifyDoctype(doctype: string): string {
  // e.g. "Client Service" -> "client-service"
  // e.g. "ToDo" -> "todo"
  return doctype.toLowerCase().replace(/\s+/g, '-');
}

export function resolveDoctypeFromSlug(slug: string): string {
  if (!slug) return slug;

  const lowerSlug = slug.toLowerCase();
  
  if (doctypeExceptions[lowerSlug]) {
    return doctypeExceptions[lowerSlug];
  }

  // Idempotent formatting: 
  // "client-service" -> "Client Service"
  // "client service" -> "Client Service"
  // "Client Service" -> "Client Service"
  return lowerSlug
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
