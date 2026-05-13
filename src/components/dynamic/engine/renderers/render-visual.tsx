import * as React from "react";
import type { BaseRendererProps } from "../engine.types";
import { sanitizeHtml } from "@/lib/utils/sanitize";

export function RenderVisual({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  
  if (field.fieldtype === "Heading") {
    return (
      <div className="col-span-full mt-6 mb-2">
        <h4 className="text-md font-semibold text-foreground border-b pb-2">{field.label}</h4>
      </div>
    );
  }

  if (field.fieldtype === "HTML") {
    return (
      <div className="col-span-full my-4">
        {field.options ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.options) }} />
        ) : (
          <div className="text-sm text-muted-foreground italic">Custom HTML Field: {field.fieldname}</div>
        )}
      </div>
    );
  }

  if (field.fieldtype === "Color") {
    return (
      <div className="flex flex-col">
        {labelNode}
        <div className="flex items-center gap-3">
          <input 
            type="color" 
            value={value || "#000000"} 
            onChange={(e) => onChange(e.target.value)}
            disabled={isReadOnly}
            className="h-10 w-16 p-1 rounded cursor-pointer border"
          />
          <span className="text-sm text-muted-foreground">{value || "None"}</span>
        </div>
      </div>
    );
  }

  if (field.fieldtype === "Rating") {
    return (
      <div className="flex flex-col">
        {labelNode}
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.5"
          value={value || 0} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={isReadOnly}
          className="w-full max-w-[200px]"
        />
        <span className="text-sm font-medium mt-1">{value || 0} / 5</span>
      </div>
    );
  }

  return null;
}
