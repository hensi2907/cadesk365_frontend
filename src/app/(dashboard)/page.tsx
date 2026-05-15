"use client";

import {
  Users, ShieldCheck, CalendarClock, CheckSquare, AlertTriangle,
  TrendingUp, Clock, FileText, Briefcase, ClipboardCheck,
  ListTodo, Building2, FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/lazy-data-table";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isHighLevelUser } = useAuthStore();

  const { data, isLoading, isError, refetch } = useDashboard(1);



  if (isError) {
    return (
      <div className="fluid-container">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.split(" ")[0] || "there";

  return (
    <div className="fluid-container space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting},{" "}
            {isLoading ? (
              <Skeleton className="inline-block h-7 w-28 align-middle rounded" />
            ) : (
              <span className="text-primary">{firstName}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => refetch()}>
          <TrendingUp className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Quick Links */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Links</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { title: "Clients", icon: Building2, href: "/cadesk365/customer/view", color: "text-blue-600 dark:text-blue-400" },
            { title: "Client Service", icon: Briefcase, href: "/cadesk365/client-service/view", color: "text-emerald-600 dark:text-emerald-400" },
            { title: "Compliance", icon: ClipboardCheck, href: "/compliance/list", color: "text-amber-600 dark:text-amber-400" },
            { title: "Tasks", icon: CheckSquare, href: "/cadesk365/task/view", color: "text-violet-600 dark:text-violet-400" },
            { title: "ToDo", icon: ListTodo, href: "/cadesk365/todo/view", color: "text-rose-600 dark:text-rose-400" },
            { title: "Tracker", icon: ShieldCheck, href: "/cadesk365/compliance-tracker/view", color: "text-primary dark:text-primary/80" },
            { title: "Docs", icon: FolderOpen, href: "/cadesk365/client-document/view", color: "text-indigo-600 dark:text-indigo-400" },
          ].map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex flex-col items-center gap-1.5 rounded-md p-3 hover:bg-accent transition-colors"
            >
              <s.icon className={cn("h-5 w-5", s.color)} />
              <span className="text-[11px] font-medium text-center">{s.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="auto-grid auto-grid-md">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          [
            { label: "Active Compliances", value: data?.total_compliance || 0, icon: ShieldCheck, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10", href: "/compliance" },
            { label: "Clients", value: data?.total_customers || 0, icon: Users, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", href: "/clients" },
            { label: "Due This Month", value: data?.compliance_due_this_month || 0, icon: CalendarClock, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10", href: "/compliance?due_this_month=1" },
            { label: "Overdue", value: data?.overdue_count || 0, icon: AlertTriangle, color: "text-red-600 dark:text-red-400 bg-red-500/10", href: "/compliance?status=Overdue" },
          ].map((m) => (
            <Link href={m.href} key={m.label} className="group relative overflow-hidden rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <div className={cn("relative h-10 w-10 rounded-lg flex items-center justify-center shrink-0", m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-xl font-semibold tracking-tight">{m.value}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Compliance Chart */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Compliance Status</h2>
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded" />
          ) : (
            <ChartCard
              title=""
              type="bar"
              data={data?.chart_status?.labels?.map((label: string, index: number) => ({
                name: label,
                value: data?.chart_status?.values?.[index] || 0
              })) || [
                  { name: "Pending", value: data?.total_compliance || 0 },
                  { name: "Completed", value: data?.completed_compliances || 0 },
                  { name: "Overdue", value: data?.overdue_count || 0 }
                ]}
              colors={["#f59e0b", "#10b981", "#ef4444"]}
              height={220}
              className="border-0 shadow-none p-0"
            />
          )}
        </div>

        {/* My Open Tasks */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">My Tasks</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-xl" />)}
            </div>
          ) : data?.my_todos_todos_open?.length ? (
            <div className="flex flex-col gap-3">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const processedTasks = [...data.my_todos_todos_open]
                  .filter((task: any) => task.status === "Open")
                  .sort((a: any, b: any) => {
                    const dateA = a.date || a.due_date;
                    const dateB = b.date || b.due_date;
                    const isOverdueA = dateA ? new Date(dateA) < today : false;
                    const isOverdueB = dateB ? new Date(dateB) < today : false;

                    if (isOverdueA && !isOverdueB) return -1;
                    if (!isOverdueA && isOverdueB) return 1;

                    const timeA = dateA ? new Date(dateA).getTime() : Infinity;
                    const timeB = dateB ? new Date(dateB).getTime() : Infinity;
                    return timeA - timeB;
                  })
                  .slice(0, 5);

                if (processedTasks.length === 0) return null;

                return processedTasks.map((task: any, idx: number) => {
                  const taskDate = task.date || task.due_date;
                  const isOverdue = taskDate ? new Date(taskDate) < today : false;

                  return (
                    <div key={idx} className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3",
                      isOverdue
                        ? "border-rose-500/20 hover:border-rose-500/40"
                        : "bg-card hover:border-primary/20 hover:shadow-sm"
                    )}>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-sm font-bold leading-tight line-clamp-2"
                        )}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock className={cn("h-3.5 w-3.5", isOverdue ? "text-rose-500" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", "text-muted-foreground")}>
                            {formatDate(taskDate)} {isOverdue && "(Overdue)"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOverdue ? (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                            Overdue
                          </span>
                        ) : (
                          <StatusBadge status={task.status} />
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <EmptyState title="No open tasks" description="All your tasks are completed!" className="border-0 p-6" />
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                ...(data?.reminder_list?.map((r: any) => ({
                  type: "reminder", title: "Compliance Reminder",
                  description: r.description, date: r.remind_at,
                  icon: Clock, color: "text-amber-500 bg-amber-500/10"
                })) || []),
                ...(data?.note?.map((n: any) => ({
                  type: "note", title: "Note",
                  description: n.title || "Untitled",
                  date: new Date().toISOString(),
                  icon: FileText, color: "text-blue-500 bg-blue-500/10"
                })) || [])
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 6)
                .map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors" >
                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", activity.color)}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{activity.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(activity.date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                    </div>
                  </div>
                ))}
              {(!data?.reminder_list?.length && !data?.note?.length) && (
                <EmptyState title="No recent activity" description="No reminders or notes found." className="border-0" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
