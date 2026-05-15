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
import { Search, Info, TrendingUp, TrendingDown, Minus, Briefcase, CheckCircle2, Clock, AlertTriangle, Target, Activity, Timer, Medal } from "lucide-react";
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
    <div className="space-y-6 fluid-container">
      {/* Sleek Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep-dive metrics and productivity analysis</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-card border rounded-xl p-1.5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Enter Employee ID..." value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-[200px] pl-9 border-0 bg-transparent focus-visible:ring-0 shadow-none h-9" />
          </div>
          <Button type="submit" size="sm" className="h-9 px-4 rounded-lg font-bold shadow-md bg-primary"><Search className="h-3.5 w-3.5 mr-1.5" />Analyze</Button>
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
          {/* Profile Header - Premium Card */}
          <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center gap-5 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xl font-black text-primary-foreground shadow-xl shadow-primary/20">
                {(data.employee_name || "E").split(" ").map((w: string) => w[0]).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{data.employee_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground">{data.designation}</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-sm font-medium text-muted-foreground">{data.department}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end relative z-10 bg-background/50 backdrop-blur-sm p-4 rounded-xl border">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Overall Score</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-4xl font-black tracking-tighter leading-none",
                  data.performance_score >= 85 ? "text-emerald-500" : data.performance_score >= 60 ? "text-primary" : "text-amber-500"
                )}>
                  {data.performance_score}
                </span>
                <span className="text-sm font-bold text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard title="Total Tasks" icon={Briefcase} value={data.total_tasks || 0} description="Assigned this period" />
            <StatCard title="Completed" icon={CheckCircle2} value={data.completed_tasks || 0} description={`${data.total_tasks ? ((data.completed_tasks / data.total_tasks) * 100).toFixed(1) : 0}% completion`} variant="success" />
            <StatCard title="Pending" icon={Clock} value={data.pending_tasks || 0} description={`${data.overdue_tasks?.open || 0} overdue`} variant={(data.overdue_tasks?.open || 0) > 0 ? "warning" : "default"} />
            <StatCard title="Total Overdue" icon={AlertTriangle} value={data.overdue_tasks?.total || 0} description={`${data.overdue_tasks?.open || 0} open · ${data.overdue_tasks?.completed || 0} done late`} variant={(data.overdue_tasks?.total || 0) > 0 ? "danger" : "success"} />
            <StatCard title="On-time Delivery" icon={Target} value={`${data.on_time_percent || 0}%`} description="Delivery performance" variant={(data.on_time_percent || 0) > 80 ? "success" : "warning"} />
            <StatCard title="Utilization" icon={Activity} value={`${data.utilization_percent || 0}%`} description="Work capacity used" variant="info" />
            <StatCard title="Avg. Delivery" icon={Timer} value={`${data.avg_completion_days || 0}d`} description="Per task average" variant="default" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Task Distribution" type="donut" data={donutData} colors={["#10b981", "#f59e0b", "#f43f5e"]} height={280} />
            <ChartCard title="Monthly Completion" type="bar" data={barData} colors={["var(--color-primary)"]} height={280} />
          </div>

          {/* Productivity, Insights & Ranking */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border bg-card overflow-hidden flex flex-col shadow-sm">
              <div className="px-6 py-5 border-b bg-card"><h3 className="text-base font-bold">Productivity Metrics</h3></div>
              <div className="p-6 space-y-6 flex-1 bg-muted/10">
                {(data.productivity || []).map((metric: any, i: number) => (
                  <ProgressBar key={i} value={metric.value} label={metric.label} variant={metric.value >= 85 ? "success" : metric.value >= 60 ? "info" : "warning"} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden flex flex-col shadow-sm">
              <div className="px-6 py-5 border-b bg-card"><h3 className="text-base font-bold">Smart Insights</h3></div>
              <div className="p-6 space-y-4 flex-1 bg-muted/10">
                {(data.insights || []).map((insight: any, i: number) => (
                  <div key={i} className="flex gap-3.5 bg-card p-3.5 rounded-xl border shadow-sm">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      insight.type === "pos" ? "bg-emerald-500/10 text-emerald-600" :
                        insight.type === "warn" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                    )}>
                      {insight.type === "pos" ? <TrendingUp className="h-4 w-4" /> :
                        insight.type === "warn" ? <TrendingDown className="h-4 w-4" /> :
                          <Minus className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed pt-1">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden flex flex-col shadow-sm">
              <div className="px-6 py-5 border-b bg-card"><h3 className="text-base font-bold">Team Ranking</h3></div>
              <div className="p-2 flex-1 bg-muted/10">
                {(data.ranking || []).map((r: any, i: number) => (
                  <div key={i} className={cn("flex items-center gap-4 p-3 rounded-xl mb-1 last:mb-0 transition-colors",
                    r.is_current ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-muted/50"
                  )}>
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-sm font-black shrink-0",
                      r.rank === 1 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                        r.rank === 2 ? "bg-slate-300/40 text-slate-700 dark:text-slate-300" :
                          r.rank === 3 ? "bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                            "bg-card border text-muted-foreground"
                    )}>
                      {r.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold truncate", r.is_current ? "text-primary" : "text-foreground")}>{r.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {r.is_current && <span className="text-[9px] uppercase font-black text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">You</span>}
                        <p className={cn("text-base font-black", r.is_current ? "text-primary" : "text-muted-foreground")}>{r.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client Stats */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b bg-card flex justify-between items-center">
              <h3 className="text-base font-bold">Client Delivery Performance</h3>
            </div>
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
      <div className="space-y-6 fluid-container">
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
