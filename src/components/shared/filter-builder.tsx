import * as React from "react";
import { Filter, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocType, DocField } from "@/types/frappe";

interface FilterBuilderProps {
  doctypeMeta: DocType;
  filters: any[];
  onChange: (filters: any[]) => void;
}

const OPERATORS = [
  { value: "=", label: "Equals" },
  { value: "!=", label: "Not Equals" },
  { value: "like", label: "Like" },
  { value: ">", label: "Greater Than" },
  { value: "<", label: "Less Than" },
  { value: "in", label: "In" },
];

export function FilterBuilder({ doctypeMeta, filters, onChange }: FilterBuilderProps) {
  const [open, setOpen] = React.useState(false);
  const filterableFields = doctypeMeta.fields.filter(f => f.fieldtype !== "HTML" && f.fieldtype !== "Section Break" && f.fieldtype !== "Column Break" && f.fieldtype !== "Table");

  const addFilter = () => {
    onChange([...filters, [filterableFields[0]?.fieldname || "name", "=", ""]]);
  };

  const updateFilter = (index: number, part: 0 | 1 | 2, value: string) => {
    const newFilters = [...filters];
    newFilters[index][part] = value;
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    onChange(newFilters);
  };

  const clearFilters = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
        <Filter className="mr-2 h-4 w-4" />
        Filter
        {filters.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {filters.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filters</h4>
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                Clear all
              </Button>
            )}
          </div>

          {filters.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
              No filters applied.
            </div>
          ) : (
            <div className="space-y-2">
              {filters.map((filter, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={filter[0]} onValueChange={(v) => updateFilter(idx, 0, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">ID</SelectItem>
                      {filterableFields.map(f => (
                        <SelectItem key={f.fieldname} value={f.fieldname}>
                          {f.label || f.fieldname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filter[1]} onValueChange={(v) => updateFilter(idx, 1, v)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    className="flex-1 h-8 text-xs"
                    placeholder="Value..."
                    value={filter[2]}
                    onChange={(e) => updateFilter(idx, 2, e.target.value)}
                  />

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFilter(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full h-8 border-dashed" onClick={addFilter}>
            <Plus className="mr-2 h-4 w-4" /> Add Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
