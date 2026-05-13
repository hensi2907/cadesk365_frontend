export interface DocField {
  fieldname: string;
  fieldtype: string;
  label: string;
  reqd?: number;
  hidden?: number;
  read_only?: number;
  in_list_view?: number;
  in_standard_filter?: number;
  options?: string;
  description?: string;
  default?: string;
  depends_on?: string;
  mandatory_depends_on?: string;
  read_only_depends_on?: string;
  columns?: number; // for grid formatting
}

export interface DocType {
  name: string;
  module: string;
  title_field?: string;
  image_field?: string;
  search_fields?: string;
  sort_field?: string;
  sort_order?: string;
  fields: DocField[];
}

export interface MetaBundle {
  user_settings: any;
  docs: (DocType | any)[];
}

export interface FrappeDocument {
  name: string;
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
  [key: string]: any;
}
