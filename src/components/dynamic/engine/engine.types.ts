import type { DocField } from "@/types/frappe";

export interface FieldRendererProps {
  field: DocField;
  value: any;
  onChange: (value: any) => void;
  formData: any;
  readOnly?: boolean;
  hideLabel?: boolean;
  error?: string;
}

export interface BaseRendererProps {
  field: DocField;
  value: any;
  onChange: (value: any) => void;
  isReadOnly: boolean;
  labelNode: React.ReactNode;
  formData: any;
  error?: string;
}
