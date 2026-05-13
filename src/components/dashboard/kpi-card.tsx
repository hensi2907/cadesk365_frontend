"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantConfig = {
  default: {
    ring: "ring-border/50",
    icon: "from-primary/15 to-primary/5 text-primary",
    glow: "",
  },
  success: {
    ring: "ring-emerald-500/20",
    icon: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
    glow: "hover:shadow-emerald-500/5",
  },
  warning: {
    ring: "ring-amber-500/20",
    icon: "from-amber-500/15 to-amber-500/5 text-amber-500",
    glow: "hover:shadow-amber-500/5",
  },
  danger: {
    ring: "ring-red-500/20",
    icon: "from-red-500/15 to-red-500/5 text-red-500",
    glow: "hover:shadow-red-500/5",
  },
  info: {
    ring: "ring-blue-500/20",
    icon: "from-blue-500/15 to-blue-500/5 text-blue-500",
    glow: "hover:shadow-blue-500/5",
  },
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: KpiCardProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/60 bg-card p-5 ring-1 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:border-border",
        config.ring,
        config.glow,
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 leading-tight">
            {label}
          </span>
          {Icon && (
            <div className={cn(
              "h-10 w-10 rounded-[14px] bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
              config.icon
            )}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
        </div>

        <p className="text-[32px] font-extrabold tracking-tight leading-none text-foreground">
          {value}
        </p>

        {(hint || trendValue) && (
          <div className="flex items-center gap-2 mt-2.5">
            {trendValue && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                  trend === "up" && "bg-emerald-500/10 text-emerald-500",
                  trend === "down" && "bg-red-500/10 text-red-500",
                  trend === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            )}
            {hint && (
              <span className="text-xs text-muted-foreground/60">{hint}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
