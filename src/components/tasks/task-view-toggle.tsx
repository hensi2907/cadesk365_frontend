"use client";

import * as React from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskView, TaskViewToggleProps } from "@/types/task-management";

export function TaskViewToggle({
  currentView,
  onViewChange,
  disabled = false,
}: TaskViewToggleProps) {
  return (
    <div className="flex rounded-xl border border-border/60 overflow-hidden bg-muted/30">
      <button
        onClick={() => onViewChange("kanban")}
        disabled={disabled}
        className={cn(
          "px-3.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5",
          currentView === "kanban" 
            ? "bg-card text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
      <button
        onClick={() => onViewChange("list")}
        disabled={disabled}
        className={cn(
          "px-3.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5",
          currentView === "list" 
            ? "bg-card text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}
