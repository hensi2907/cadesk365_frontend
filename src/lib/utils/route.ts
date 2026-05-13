import { slugifyDoctype } from "./doctype-slug";

/**
 * Generate a safe URL for navigating to a specific Frappe record detail page.
 * @param doctype - The name of the DocType (e.g. "Compliance Tracker", "Item")
 * @param name - The name/ID of the record (e.g. "Record / Name")
 * @returns The formatted URL path (e.g. "/cadesk365/compliance-tracker/Record%20%2F%20Name")
 */
export function getRecordRoute(doctype: string, name: string): string {
  const slug = slugifyDoctype(doctype);
  const encodedName = encodeURIComponent(name);
  return `/cadesk365/${slug}/${encodedName}`;
}

/**
 * Generate a safe URL for navigating to a list view of a Frappe DocType.
 * @param doctype - The name of the DocType
 * @returns The formatted URL path (e.g. "/cadesk365/compliance-tracker/view")
 */
export function getListRoute(doctype: string): string {
  const slug = slugifyDoctype(doctype);
  return `/cadesk365/${slug}/view`;
}

/**
 * Generate a safe URL for navigating to the create new record page.
 * @param doctype - The name of the DocType
 * @returns The formatted URL path (e.g. "/cadesk365/compliance-tracker/new")
 */
export function getNewRecordRoute(doctype: string): string {
  const slug = slugifyDoctype(doctype);
  return `/cadesk365/${slug}/new`;
}
