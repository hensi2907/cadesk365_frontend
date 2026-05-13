import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import type { BaseRendererProps } from "../engine.types";

export function RenderText({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  const isCode = field.fieldtype === "Code" || field.fieldtype === "JSON";
  
  return (
    <div className="flex flex-col">
      {labelNode}
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={isReadOnly}
        placeholder={`Enter ${field.label}...`}
        className={`min-h-[100px] ${isCode ? "font-mono text-xs bg-muted/30" : ""}`}
      />
    </div>
  );
}
