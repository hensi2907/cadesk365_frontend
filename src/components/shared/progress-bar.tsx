import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number, max: number) => string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value, max = 100, label, showValue = true,
  valueFormatter = (val, m) => `${Math.round((val / m) * 100)}%`,
  variant = "default", size = "md", className, ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const barColors = {
    default: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
  };
  const sizes = { sm: "h-1.5", md: "h-2", lg: "h-3" };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground text-xs">{label}</span>}
          {showValue && <span className="text-muted-foreground text-xs font-medium">{valueFormatter(value, max)}</span>}
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-secondary", sizes[size])}>
        <div className={cn("h-full transition-all duration-500 ease-out rounded-full", barColors[variant])} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
