"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

interface ChartCardProps {
  title: string;
  type: "donut" | "bar" | "line";
  data: any[];
  colors?: string[];
  height?: number;
  minWidth?: number;
  className?: string;
}

const DEFAULT_COLORS = ["#14b8a6", "#f59e0b", "#f43f5e", "#3b82f6", "#8b5cf6"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
        <p className="mb-1 text-xs font-medium text-foreground">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload.fill }}
            />
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartCard({
  title,
  type,
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  minWidth = 200,
  className,
}: ChartCardProps) {
  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const textColor = isDark ? "#71717a" : "#52525b";
  const gridColor = isDark ? "rgba(113,113,122,0.1)" : "rgba(10,10,10,0.06)";

  return (
    <div className={cn("flex flex-col rounded-lg border bg-card p-5", className)}>
      {title && <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>}
      <div style={{ height: `${height}px`, width: "100%", minHeight: `${height}px`, minWidth: `${minWidth}px` }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={minWidth} minHeight={height}>
          {type === "donut" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : type === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: "var(--background)", stroke: colors[0] }}
                activeDot={{ r: 5, strokeWidth: 0, fill: colors[0] }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Legend for Donut */}
      {type === "donut" && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
