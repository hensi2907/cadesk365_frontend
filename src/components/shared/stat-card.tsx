import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const iconBg = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  className,
  onClick,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return <Skeleton className={cn("h-[90px] w-full rounded-xl shadow-sm", className)} />;
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 active:scale-[0.98]",
        className
      )}
    >
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      )}
      <div className="relative flex items-center gap-3">
        {Icon && (
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-semibold tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
      {description && (
        <div className="mt-2 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
