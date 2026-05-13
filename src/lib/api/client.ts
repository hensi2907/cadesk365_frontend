import type { FrappeResponse } from "@/types/api";
import { resolveDoctypeFromSlug } from "../utils/doctype-slug";

const BASE_URL = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || "http://192.168.1.150:8000");

let csrfToken = "";
let csrfPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/method/cadesk365.api.user_permission.get_csrf_token`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await res.json();
      csrfToken = data.message || "";
    } catch {
      csrfToken = "";
    }
    csrfPromise = null;
    return csrfToken;
  })();

  return csrfPromise;
}

export function resetCsrfToken() {
  csrfToken = "";
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | FormData;
}

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = await getCsrfToken();
  const { body, headers: customHeaders, ...rest } = options;

  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    "X-Frappe-CSRF-Token": token,
    ...(customHeaders as Record<string, string>),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // console.log(`[API] ${options.method || "GET"} ${endpoint}`, body ? { body } : "");

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    credentials: "include",
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const data: any = await res.json();

  // console.log(`[API] ${endpoint} response:`, { ok: res.ok, hasMessage: !!data.message, exc: data.exc });

  if (!res.ok || data.exc) {
    let errorMessage = "Something went wrong";
    if (data._server_messages) {
      try {
        const msgs = JSON.parse(data._server_messages);
        const parsed = JSON.parse(msgs[0]);
        errorMessage = parsed.message || errorMessage;
      } catch {
        errorMessage = data._server_messages;
      }
    }
    console.error(`[API] ${endpoint} error:`, errorMessage, data);
    throw new Error(errorMessage);
  }

  if (data.message !== undefined) {
    return data.message as T;
  }
  return data as T;
}

/** Call a Frappe whitelisted method */
export function callMethod<T = unknown>(
  method: string,
  args?: Record<string, unknown>
): Promise<T> {
  return fetchAPI<T>(`/api/method/${method}`, {
    method: "POST",
    body: args,
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain"
];

/** Upload a file to Frappe */
export async function uploadFile(
  file: File,
  doctype?: string,
  docname?: string,
  fieldname?: string
): Promise<{ file_url: string; name: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
    throw new Error(`Invalid file type: ${file.type || "unknown"}. Supported types: PDF, Images, Word, Excel, CSV.`);
  }
  const token = await getCsrfToken();
  const fd = new FormData();
  fd.append("file", file);
  
  if (doctype) {
    const resolvedDoctype = resolveDoctypeFromSlug(doctype);
    fd.append("doctype", resolvedDoctype);
  }
  if (docname) fd.append("docname", docname);
  if (fieldname) fd.append("fieldname", fieldname);

  const res = await fetch(`${BASE_URL}/api/method/upload_file`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Frappe-CSRF-Token": token },
    body: fd,
  });

  const data = await res.json();
  if (!data.message) throw new Error("Upload failed");
  return data.message;
}

/** Search options for a Link field using Frappe API */
export async function searchLink(
  doctype: string,
  query: string,
  searchFields: string[] = ["name"]
): Promise<{ name: string;[key: string]: any }[]> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);

  // For Dynamic Link's DocType selector, use our secure endpoint
  // that respects role-based permissions instead of the restricted get_list
  if (resolvedDoctype.toLowerCase() === "doctype") {
    const params = new URLSearchParams();
    if (query) params.append("query", query);

    const data = await fetchAPI<any[]>(`/api/method/cadesk365.api.user_permission.get_allowed_doctypes?${params.toString()}`);
    return data || [];
  }

  const orFilters = searchFields.map((f) => [resolvedDoctype, f, "like", `%${query}%`]);

  const params = new URLSearchParams();
  params.append("doctype", resolvedDoctype);
  params.append("fields", JSON.stringify(["name", ...searchFields.filter(f => f !== "name")]));
  params.append("or_filters", JSON.stringify(orFilters));
  params.append("limit_page_length", "15");
  params.append("order_by", "name asc");

  const res = await fetch(`${BASE_URL}/api/method/frappe.client.get_list?${params.toString()}`, {
    credentials: "include",
  });

  const data = await res.json();
  return data.message || [];
}

/** Create a new document in Frappe */
export async function createDocument<T = any>(doc: Record<string, any>): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(`${BASE_URL}/api/method/frappe.client.insert`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": token,
    },
    body: JSON.stringify({ doc }),
  });

  const data = await res.json();
  if (!res.ok || data.exc) {
    const errMsg = data._server_messages
      ? JSON.parse(JSON.parse(data._server_messages)[0]).message
      : data.exc || "Failed to create document";
    throw new Error(errMsg);
  }

  return data.message as T;
}
