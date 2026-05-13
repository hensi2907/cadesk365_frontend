import { callMethod, fetchAPI } from "./client";
import type { MetaBundle, DocType, FrappeDocument } from "@/types/frappe";
import { resolveDoctypeFromSlug } from "../utils/doctype-slug";

/**
 * Fetch Doctype metadata using Frappe's internal desk API.
 * This returns the fields, permissions, and layout information.
 */
export async function getDoctypeMeta(doctype: string): Promise<DocType> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);

  try {
    const data = await callMethod<{ docs: any[] }>(
      "frappe.desk.form.load.getdoctype",
      { doctype: resolvedDoctype }
    );

    if (data && data.docs) {
      const meta = data.docs.find((d: any) => d.doctype === "DocType" && d.name === resolvedDoctype);
      if (meta) return meta as DocType;
    }
  } catch (err) {
    console.warn(`Desk API failed for ${doctype}, trying client.get fallback`, err);
  }

  // Fallback: Try frappe.client.get
  try {
    const data = await callMethod<any>("frappe.client.get", {
      doctype: "DocType",
      name: resolvedDoctype,
    });
    if (data) return data as DocType;
  } catch (err) {
    console.error(`Fallback also failed for ${doctype}`, err);
  }

  throw new Error(`Failed to load metadata for ${doctype}`);
}

/**
 * Generic list fetching wrapper.
 */
export async function getDoctypeList<T = any>(
  doctype: string,
  fields: string[] = ["name"],
  filters: any[] = [],
  limit_start: number = 0,
  limit_page_length: number = 20,
  order_by: string = "modified desc"
): Promise<T[]> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  const params = new URLSearchParams({
    doctype: resolvedDoctype,
    fields: JSON.stringify(fields),
    filters: JSON.stringify(filters),
    limit_start: limit_start.toString(),
    limit_page_length: limit_page_length.toString(),
    order_by,
  });

  return fetchAPI<T[]>(`/api/method/frappe.client.get_list?${params.toString()}`);
}

/**
 * Fetch total count of documents for a doctype.
 */
export async function getDoctypeCount(
  doctype: string,
  filters: any[] = []
): Promise<number> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  const params = new URLSearchParams({
    doctype: resolvedDoctype,
    filters: JSON.stringify(filters),
  });
  return fetchAPI<number>(`/api/method/frappe.client.get_count?${params.toString()}`);
}

/**
 * Fetch a single document record by name.
 */
export async function getDoctypeRecord<T = FrappeDocument>(
  doctype: string,
  name: string
): Promise<T> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  const params = new URLSearchParams({
    doctype: resolvedDoctype,
    name,
  });
  return fetchAPI<T>(`/api/method/frappe.client.get?${params.toString()}`);
}

/**
 * Insert a new document.
 */
export async function insertDoctypeRecord<T = FrappeDocument>(
  doc: Record<string, any>
): Promise<T> {
  if (doc.doctype) {
    doc.doctype = resolveDoctypeFromSlug(doc.doctype);
  }
  return fetchAPI<T>("/api/method/frappe.client.insert", {
    method: "POST",
    body: { doc },
  });
}

/**
 * Save an existing document.
 */
export async function saveDoctypeRecord<T = FrappeDocument>(
  doc: Record<string, any>
): Promise<T> {
  if (doc.doctype) {
    doc.doctype = resolveDoctypeFromSlug(doc.doctype);
  }
  return fetchAPI<T>("/api/method/frappe.client.save", {
    method: "POST",
    body: { doc },
  });
}

/**
 * Delete a document.
 */
export async function deleteDoctypeRecord(
  doctype: string,
  name: string
): Promise<string> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  return fetchAPI<string>("/api/method/frappe.client.delete", {
    method: "POST",
    body: { doctype: resolvedDoctype, name },
  });
}


export async function UpdateDoctypeRecordValue(
  doctype: string,
  name: string,
  fieldname: string,
  field_value: any
): Promise<string> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  return fetchAPI<string>("/api/method/frappe.client.set_value", {
    method: "POST",
    body: { doctype: resolvedDoctype, name },
  });
}

/**
 * Submit a document.
 */
export async function submitDoctypeRecord<T = FrappeDocument>(
  doc: Record<string, any>
): Promise<T> {
  if (doc.doctype) {
    doc.doctype = resolveDoctypeFromSlug(doc.doctype);
  }
  return fetchAPI<T>("/api/method/frappe.client.submit", {
    method: "POST",
    body: { doc },
  });
}

/**
 * Fetch Print Formats for a specific Doctype.
 */
export async function getPrintFormats(doctype: string): Promise<{ name: string }[]> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  const params = new URLSearchParams({
    doctype: "Print Format",
    fields: JSON.stringify(["name"]),
    filters: JSON.stringify([["doc_type", "=", resolvedDoctype]]),
    limit_page_length: "100",
  });
  return fetchAPI<{ name: string }[]>(`/api/method/frappe.client.get_list?${params.toString()}`);
}
