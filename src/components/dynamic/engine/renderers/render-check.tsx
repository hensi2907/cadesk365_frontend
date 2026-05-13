import * as React from "react";
import type { BaseRendererProps } from "../engine.types";

export function RenderCheck({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  return (
    <div className="flex items-center space-x-3 pt-8 pb-2">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked ? 1 : 0)}
        disabled={isReadOnly}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      {labelNode}
    </div>
  );
}
