import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItemProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: React.ReactNode;
  icon?: React.ReactNode;
  status?: "default" | "success" | "warning" | "error" | "info";
}

interface ActivityTimelineProps {
  items: TimelineItemProps[];
  className?: string;
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("relative space-y-0", className)}>
      {/* Vertical Line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border/60" />

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        // Status colors
        const statusColors = {
          default: "bg-muted text-muted-foreground border-border",
          success: "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
          warning: "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
          error: "bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
          info: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
        };

        const colorClass = statusColors[item.status || "default"];

        return (
          <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline Dot/Icon */}
            <div className="relative z-10 flex mt-0.5">
              <div 
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ring-4 ring-background",
                  colorClass
                )}
              >
                {item.icon ? (
                  <div className="h-4 w-4">{item.icon}</div>
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 gap-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm text-foreground">
                  {item.title}
                </div>
                {item.timestamp && (
                  <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                    {item.timestamp}
                  </div>
                )}
              </div>
              
              {item.description && (
                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
