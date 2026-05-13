import * as React from "react";
import { Input } from "@/components/ui/input";
import type { BaseRendererProps } from "../engine.types";

export function RenderDate({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  let type = "text";
  if (field.fieldtype === "Date") type = "date";
  if (field.fieldtype === "Datetime") type = "datetime-local";
  if (field.fieldtype === "Time") type = "time";
  
  // Duration in Frappe is usually stored in seconds, but we'll render it as a simple text/number input for now
  if (field.fieldtype === "Duration") type = "number";

  return (
    <div className="flex flex-col">
      {labelNode}
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={isReadOnly}
        className="h-10"
        placeholder={field.fieldtype === "Duration" ? "Duration (seconds)" : ""}
      />
    </div>
  );
}
