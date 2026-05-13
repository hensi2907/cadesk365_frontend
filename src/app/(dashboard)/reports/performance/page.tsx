"use client";

import * as React from "react";
import { Suspense } from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { useQuery } from "@tanstack/react-query";
import { getPerformanceReport, getTeamRanking } from "@/lib/api/hrms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Info, TrendingUp, TrendingDown, Minus, Medal } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import type { ClientStat } from "@/types/api";
import { cn } from "@/lib/utils";

const FINANCIALS = [
  { label: 'Revenue generated', value: '₹48.2L', delta: '+14% vs last quarter', dir: 'up' },
  { label: 'Cost to company', value: '₹12.6L', delta: 'Salary + overhead', dir: 'neu' },
  { label: 'Profit contribution', value: '₹35.6L', delta: 'ROI: 2.8×', dir: 'up' },
];

const TREND_DATA = { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], values: [32, 35, 30, 38, 44, 48] };

function PerformancePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState(searchParams.get("employee") || "");
  const [activeEmployeeId, setActiveEmployeeId] = React.useState(searchParams.get("employee") || "");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["performance", activeEmployeeId],
    queryFn: async () => {
      const [perf, rank] = await Promise.all([
        getPerformanceReport(activeEmployeeId),
        getTeamRanking(activeEmployeeId)
      ]);
      return {
        ...(perf || {}),
        ranking: rank?.ranking || []
      };
    },
    enabled: !!activeEmployeeId,
  });



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId) {
      router.push(`/reports/performance?employee=${employeeId}`);
      setActiveEmployeeId(employeeId);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "bg-primary/10 text-primary/90 dark:text-primary/80 border border-primary/20 dark:border-primary/80";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
  };

  const donutData = React.useMemo(() => {
    if (!data) return [];
    return [
      { name: "Completed", value: data.completed_tasks },
      { name: "Pending", value: data.pending_tasks - data.overdue_tasks.open },
      { name: "Overdue", value: data.overdue_tasks.open },
    ];
  }, [data]);

  const barData = React.useMemo(() => {
    if (!data?.monthly_task_completion) return [];
    return data.monthly_task_completion.labels.map((label: string, i: number) => ({
      name: label, value: data.monthly_task_completion.values[i],
    }));
  }, [data]);

  const trendLineData = React.useMemo(() => {
    return TREND_DATA.labels.map((label: string, i: number) => ({
      name: label, value: TREND_DATA.values[i],
    }));
  }, []);

  const clientColumns: ColumnDef<ClientStat>[] = [
    { accessorKey: "client", header: "Client", cell: ({ row }) => <span className="font-medium">{row.getValue("client")}</span> },
    { accessorKey: "total_compliances", header: "Total" },
    { accessorKey: "completed", header: "Completed", cell: ({ row }) => <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.getValue("completed")}</span> },
    { accessorKey: "pending", header: "Pending" },
    {
      accessorKey: "overdue", header: "Overdue",
      cell: ({ row }) => {
        const val = row.getValue("overdue") as number;
        return <span className={val > 0 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground"}>{val}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <PageHeader title="Employee Performance" description="Detailed metrics and productivity analysis." className="mb-0" />
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Employee ID..." value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-[180px]" />
          <Button type="submit" variant="secondary" size="sm" className="!bg-primary/80 "><Search className="h-3.5 w-3.5 mr-1.5" />Analyze</Button>
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}</div>
        </div>
      ) : isError || !data ? (
        <div className="p-12 text-center border rounded-lg bg-card">
          <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-base font-medium">No Data Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Please enter a valid Employee ID to view performance data.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                {(data.employee_name || "E").split(" ").map((w: string) => w[0]).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{data.employee_name}</h2>
                <p className="text-sm text-muted-foreground">{data.designation} · {data.department}</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-xs text-muted-foreground mb-1">Score</span>
              <span className={cn("px-3 py-1 rounded-md text-lg font-bold", getScoreColor(data.performance_score))}>{data.performance_score}</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <StatCard title="Total Tasks" value={data.total_tasks || 0} description="Assigned this period" />
            <StatCard title="Completed" value={data.completed_tasks || 0} description={`${data.total_tasks ? ((data.completed_tasks / data.total_tasks) * 100).toFixed(1) : 0}% completion`} variant="success" />
            <StatCard title="Pending" value={data.pending_tasks || 0} description={`${data.overdue_tasks?.open || 0} overdue`} variant={(data.overdue_tasks?.open || 0) > 0 ? "warning" : "default"} />
            <StatCard title="Total Overdue" value={data.overdue_tasks?.total || 0} description={`${data.overdue_tasks?.open || 0} open · ${data.overdue_tasks?.completed || 0} done late`} variant={(data.overdue_tasks?.total || 0) > 0 ? "danger" : "success"} />
            <StatCard title="On-time" value={`${data.on_time_percent || 0}%`} description="Delivery performance" variant={(data.on_time_percent || 0) > 80 ? "success" : "warning"} />
            <StatCard title="Utilization" value={`${data.utilization_percent || 0}%`} description="Work capacity used" variant="info" />
            <StatCard title="Avg. Delivery" value={`${data.avg_completion_days || 0}d`} description="Per task average" variant="default" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard title="Task Distribution" type="donut" data={donutData} colors={["#10b981", "#f59e0b", "#f43f5e"]} height={240} />
            <ChartCard title="Monthly Completion" type="bar" data={barData} colors={["#14b8a6"]} height={240} />
            <ChartCard title="Revenue Trend (₹ Lakh)" type="line" data={trendLineData} colors={["#14b8a6"]} height={240} />
          </div>

          {/* Productivity, Insights & Ranking */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30"><h3 className="text-sm font-medium">Productivity Metrics</h3></div>
              <div className="p-5 space-y-5 flex-1">
                {(data.productivity || []).map((metric: any, i: number) => (
                  <ProgressBar key={i} value={metric.value} label={metric.label} variant={metric.value >= 85 ? "success" : metric.value >= 60 ? "info" : "warning"} />
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30"><h3 className="text-sm font-medium">Smart Insights</h3></div>
              <div className="p-5 space-y-3 flex-1">
                {(data.insights || []).map((insight: any, i: number) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {insight.type === "pos" ? <TrendingUp className="h-4 w-4 text-emerald-500" /> :
                        insight.type === "warn" ? <TrendingDown className="h-4 w-4 text-amber-500" /> :
                          <Minus className="h-4 w-4 text-blue-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30"><h3 className="text-sm font-medium">Team Ranking</h3></div>
              <div className="p-0 flex-1">
                {(data.ranking || []).map((r: any, i: number) => (
                  <div key={i} className={cn("flex items-center gap-3 p-4 border-b last:border-0", r.is_current ? "bg-primary/5" : "")}>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                      {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", r.is_current && "text-primary")}>{r.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{r.score}</p>
                      {r.is_current && <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded-full ml-2">You</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Financial Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FINANCIALS.map((f, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{f.label}</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{f.value}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                    {f.dir === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : f.dir === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-amber-500" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className={f.dir === 'up' ? "text-emerald-600 dark:text-emerald-400" : f.dir === 'down' ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                      {f.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Stats */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Client Delivery Performance</h3>
            <DataTable columns={clientColumns} data={data.client_stats || []} pageSize={5} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}</div>
        </div>
      </div>
    }>
      <PerformancePageContent />
    </Suspense>
  );
}
