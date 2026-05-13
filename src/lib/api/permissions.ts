import { callMethod } from "./client";
import { resolveDoctypeFromSlug } from "../utils/doctype-slug";

export interface DocTypePermissions {
  user: string;
  doctype: string;
  select: boolean;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  print: boolean;
  email: boolean;
  report: boolean;
  export: boolean;
  share: boolean;
  submit: boolean;
  import: boolean;
  cancel: boolean;
  amend: boolean;
}

export function getAllUserPermissions(doctype: string): Promise<DocTypePermissions> {
  const resolvedDoctype = resolveDoctypeFromSlug(doctype);
  return callMethod<DocTypePermissions>(
    "cadesk365.api.user_permission.all_user_permissions",
    { doctype: resolvedDoctype }
  );
}
