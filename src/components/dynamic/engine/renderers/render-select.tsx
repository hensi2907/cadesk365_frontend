import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BaseRendererProps } from "../engine.types";

export function RenderSelect({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  const options = React.useMemo(() => {
    if (!field.options) return [];
    return field.options.split("\n").filter(Boolean);
  }, [field.options]);

  return (
    <div className="flex flex-col">
      {labelNode}
      <Select
        value={value || ""}
        onValueChange={onChange}
        disabled={isReadOnly}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
