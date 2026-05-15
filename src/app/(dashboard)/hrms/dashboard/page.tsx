"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, UserPlus, Clock, Calendar,
  Wallet, FileCheck, ArrowUpRight,
  UserCheck, PlaneLanding, Briefcase
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { DataTable } from "@/components/shared/lazy-data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecordRoute } from "@/lib/utils/route";
import { getHrmsData } from "@/lib/api/hrms";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HRDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["hrms-dashboard"],
    queryFn: () => getHrmsData("dashboard"),
  });

  const stats = [
    { title: "Total Employees", value: dashboardData?.stats?.total_employees?.toString() || "0", icon: Users, variant: "info" as const },
    { title: "Present Today", value: dashboardData?.stats?.present_today?.toString() || "0", icon: UserCheck, variant: "success" as const },
    { title: "On Leave", value: dashboardData?.stats?.on_leave?.toString() || "0", icon: PlaneLanding, variant: "warning" as const },
    { title: "Pending Approvals", value: dashboardData?.stats?.pending_approvals?.toString() || "0", icon: Clock, variant: "danger" as const },
  ];

  const shortcuts = [
    { label: "Add Employee", href: "/cadesk365/employee/view", icon: UserPlus, color: "text-blue-500 bg-blue-500/10" },
    { label: "Approve Leaves", href: "/hrms/leaves", icon: Calendar, color: "text-purple-500 bg-purple-500/10" },
    { label: "Payroll Processing", href: "/hrms/salary", icon: Wallet, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Expense Review", href: "/hrms/expenses", icon: FileCheck, color: "text-amber-500 bg-amber-500/10" },
  ];

  const attendanceData = dashboardData?.attendance_trend?.length ? dashboardData.attendance_trend : [
    { name: "N/A", value: 0 },
  ];

  const departmentData = dashboardData?.department_distribution?.length ? dashboardData.department_distribution : [
    { name: "Loading...", value: 1 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="HR Dashboard"
        description="Monitor workforce analytics, manage approvals, and streamline HR operations."
      />

      <div className="auto-grid auto-grid-md">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <ChartCard
              title="Attendance Trend (Last 5 Days)"
              type="bar"
              data={attendanceData}
              colors={["#14b8a6"]}
              height={280}
            />
            <ChartCard
              title="Team Distribution"
              type="donut"
              data={departmentData}
              colors={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"]}
              height={280}
            />
          </div>

          <Card className="rounded-2xl border-none bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Pending Requests</CardTitle>
              <Link
                href="/hrms/leaves"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary hover:text-primary font-bold")}
              >
                View All <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: "employee",
                    header: "Employee",
                    cell: ({ row }: any) => {
                      const empName = row.getValue("employee") || "Unknown";
                      return (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                            {empName[0]}
                          </div>
                          <span className="font-medium text-sm">{empName}</span>
                        </div>
                      )
                    }
                  },
                  {
                    accessorKey: "doctype",
                    header: "Request Type",
                    cell: ({ row }: any) => (
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{row.original.doctype}</span>
                        <span className="text-xs text-muted-foreground">{row.original.type}</span>
                      </div>
                    )
                  },
                  { accessorKey: "department", header: "Department" },
                  { accessorKey: "dates", header: "Date / Period" },
                  {
                    accessorKey: "status",
                    header: "Status",
                    cell: ({ row }: any) => {
                      const status = row.getValue("status");
                      const isDraft = status === "Draft" || status === "Open" || status === 0;
                      return (
                        <Badge variant="outline" className={cn(
                          "font-semibold",
                          isDraft ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {status === 0 ? "Draft" : status}
                        </Badge>
                      )
                    }
                  },
                  {
                    id: "action",
                    header: "",
                    cell: ({ row }: any) => (
                      <Link href={getRecordRoute(row.original.doctype, row.original.name)}>
                        <Button size="sm" className="h-8 bg-primary/50 hover:bg-primary text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all">View</Button>
                      </Link>
                    )
                  }
                ]}
                data={dashboardData?.pending_requests || []}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-2xl border-none bg-card shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {shortcuts.map((shortcut) => (
                <Link
                  key={shortcut.label}
                  href={shortcut.href}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 hover:bg-accent transition-all group gap-3 text-center"
                >
                  <div className={`p-3 rounded-xl ${shortcut.color} transition-transform group-hover:scale-110`}>
                    <shortcut.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                    {shortcut.label}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">HR Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
              {Array.isArray(dashboardData?.insights) && dashboardData.insights.length > 0 ? (
                dashboardData.insights.map((insight: { type: string; title: string; message: string }, i: number) => {
                  const colorMap: Record<string, { bg: string; text: string; icon: typeof Briefcase }> = {
                    positive: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", icon: UserCheck },
                    warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: Clock },
                    info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: Briefcase },
                  };
                  const style = colorMap[insight.type] || colorMap.info;
                  const IconComp = style.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", style.bg, style.text)}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{insight.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No insights available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
