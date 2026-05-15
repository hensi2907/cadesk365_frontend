"use client";

import { Filter, ExternalLink, ShieldCheck, AlertTriangle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable } from "@/components/shared/data-table";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getDueBadgeVariant } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import type { ComplianceTracker } from "@/types/api";

export default function CompliancePage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useDashboard(0);

  useEffect(() => {
    if (data) {
      // console.log("[Compliance] Data loaded:", {
      //   totalCompliances: data.total_compliances, pending: data.pending_compliances,
      //   completed: data.completed_compliances, overdue: data.overdue_count,
      //   trackers: data.active_compliance_list?.length,
      // });
    }
  }, [data]);

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const trackers = data?.active_compliance_list || [];
  const filtered = statusFilter === "all" ? trackers : trackers.filter((t: ComplianceTracker) => t.status === statusFilter);

  const stats = [
    { label: "Total", value: data?.total_compliances || 0, icon: ShieldCheck, color: "text-primary bg-primary/10" },
    { label: "Pending", value: data?.pending_compliances || 0, icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    { label: "Completed", value: data?.completed_compliances || 0, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { label: "Overdue", value: data?.overdue_count || 0, icon: AlertTriangle, color: "text-red-600 dark:text-red-400 bg-red-500/10" },
  ];

  const byStatusData = useMemo(() => {
    if (!data?.chart_status) return [];
    return data.chart_status.labels.map((label: string, i: number) => ({ name: label, value: data.chart_status.values[i] || 0 }));
  }, [data]);

  const byTypeData = useMemo(() => {
    if (!data?.chart_type) return [];
    return data.chart_type.labels.map((label: string, i: number) => ({ name: label, value: data.chart_type.values[i] || 0 }));
  }, [data]);

  const overdueList = data?.overdue_list || [];

  const columns: ColumnDef<ComplianceTracker>[] = [
    { accessorKey: "compliance", header: "Compliance", cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("compliance")}</span> },
    { accessorKey: "customer", header: "Client", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("customer")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.getValue("status")} /> },
    {
      accessorKey: "due_date", header: "Due Date",
      cell: ({ row }) => {
        const dueBadge = getDueBadgeVariant(row.getValue("due_date"));
        return (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded",
            dueBadge === "overdue" && "bg-red-500/10 text-red-600 dark:text-red-400",
            dueBadge === "today" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            dueBadge === "tomorrow" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            dueBadge === "normal" && "text-muted-foreground"
          )}>{formatDate(row.getValue("due_date"))}</span>
        );
      },
    },
    { accessorKey: "frequency", header: "Frequency", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("frequency") || "—"}</span> },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <a href={`/app/compliance-tracker/${row.original.name}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 hover:underline transition-all"
          onClick={(e) => e.stopPropagation()}>
          Open <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-5 fluid-container">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage all client compliance deadlines</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", s.color)}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">By Status</h2>
          {isLoading ? <Skeleton className="h-44 w-full rounded" /> : byStatusData.length > 0 ? (
            <ChartCard title="" type="bar" data={byStatusData} colors={["#f59e0b", "#ef4444", "#10b981"]} height={180} className="border-0 shadow-none p-0" />
          ) : <div className="text-sm text-muted-foreground text-center py-12">No data available.</div>}
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">By Type</h2>
          {isLoading ? <Skeleton className="h-44 w-full rounded" /> : byTypeData.length > 0 ? (
            <ChartCard title="" type="bar" data={byTypeData} colors={["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"]} height={180} className="border-0 shadow-none p-0" />
          ) : <div className="text-sm text-muted-foreground text-center py-12">No data available.</div>}
        </div>
      </div>

      {/* {overdueList.length > 0 && (
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-medium text-foreground">Overdue Compliances</h2>
          </div>
          <div className="space-y-1.5">
            {overdueList.slice(0, 5).map((item: ComplianceTracker) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-md border border-red-200/30 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900/20">
                <div>
                  <div className="font-medium text-sm">{item.compliance} — {item.customer}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Due: {formatDate(item.due_date)}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )} */}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        </div>
        {["all", "Pending", "Completed", "Overdue"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              statusFilter === s ? "bg-primary/10 border-primary/20 text-primary" : "border-border hover:bg-accent text-muted-foreground"
            )}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="compliance"
        searchPlaceholder="Search compliance..."
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        emptyTitle="No compliance records"
        emptyDescription="No records match the current filters."
        onRowClick={(row) => window.location.href = `/cadesk365/compliance-tracker/${row.name}`}
      />
    </div>
  );
}
