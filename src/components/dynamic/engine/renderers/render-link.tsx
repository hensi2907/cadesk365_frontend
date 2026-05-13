import * as React from "react";
import { LinkField } from "@/components/shared/link-field";
import type { BaseRendererProps } from "../engine.types";

export function RenderLink({ field, value, onChange, isReadOnly, labelNode, formData }: BaseRendererProps) {
  // If it's a Dynamic Link, the doctype is specified in another field (field.options holds the fieldname)
  let linkDoctype = field.options || "";

  if (field.fieldtype === "Dynamic Link") {
    linkDoctype = formData[field.options || ""] || "";
  }

  return (
    <div className="flex flex-col">
      {labelNode}
      <LinkField
        doctype={linkDoctype}
        value={value || ""}
        onChange={(val) => onChange(val)}
        disabled={isReadOnly || (field.fieldtype === "Dynamic Link" && !linkDoctype)}
        placeholder={`Search ${linkDoctype || "record"}...`}
      />
    </div>
  );
}
