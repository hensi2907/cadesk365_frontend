import * as React from "react";
import { Input } from "@/components/ui/input";
import type { BaseRendererProps } from "../engine.types";

export function RenderData({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  let type = "text";
  if (field.fieldtype === "Password") type = "password";
  if (field.fieldtype === "Email") type = "email";
  if (field.fieldtype === "Phone") type = "tel";
  if (field.fieldtype === "URL") type = "url";
  if (field.fieldtype === "Int" || field.fieldtype === "Float" || field.fieldtype === "Currency" || field.fieldtype === "Percent") type = "number";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val: any = e.target.value;
    if (val === "") {
      onChange(null);
      return;
    }
    
    if (field.fieldtype === "Int") {
      val = parseInt(val, 10);
    } else if (field.fieldtype === "Float" || field.fieldtype === "Currency" || field.fieldtype === "Percent") {
      val = parseFloat(val);
    }
    
    onChange(val);
  };

  if (field.fieldtype === "Read Only") {
    return (
      <div className="flex flex-col">
        {labelNode}
        <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm">
          {value !== undefined && value !== null ? String(value) : "-"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {labelNode}
      <Input
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        disabled={isReadOnly}
        placeholder={`Enter ${field.label}...`}
        className="h-10"
      />
    </div>
  );
}
