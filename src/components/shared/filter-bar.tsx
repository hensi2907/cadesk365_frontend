"use client";

import * as React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "search" | "pill";
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  activeFilters: Record<string, string>;
  className?: string;
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  activeFilters,
  className,
}: FilterBarProps) {
  const hasActiveFilters = Object.keys(activeFilters).some(key => activeFilters[key] !== "");

  return (
    <div className={cn("flex  items-center gap-2", className)}>
      {filters.map((filter) => {
        if (filter.type === "search") {
          return (
            <div key={filter.key} className="relative w-full max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={filter.placeholder || "Search..."}
                value={activeFilters[filter.key] || ""}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          );
        }

        if (filter.type === "select") {
          return (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || filter.defaultValue || "all"}
              onValueChange={(val) => onFilterChange(filter.key, val === "all" ? "" : (val || ""))}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder={filter.placeholder || "Select option"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        if (filter.type === "pill") {
          return (
            <div key={filter.key} className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onFilterChange(filter.key, "")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                  !activeFilters[filter.key]
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "border-border hover:bg-accent text-muted-foreground"
                )}
              >
                All
              </button>
              {filter.options?.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(filter.key, opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                    activeFilters[filter.key] === opt.value
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "border-border hover:bg-accent text-muted-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          );
        }

        return null;
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 ml-auto text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
