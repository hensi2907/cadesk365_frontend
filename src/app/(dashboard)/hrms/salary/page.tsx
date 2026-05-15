"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { useQuery } from "@tanstack/react-query";
import { getHrmsData } from "@/lib/api/hrms";
import type { SalarySlip } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Wallet, Users, FileCheck, ArrowUpRight, Banknote } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SalaryPage() {
  const [selectedSlip, setSelectedSlip] = React.useState<SalarySlip | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrms_salary"],
    queryFn: () => getHrmsData("salary") as any,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleDownload = (slipName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://192.168.1.150:8000";
    const url = `${baseUrl}/api/method/frappe.utils.print_format.download_pdf?doctype=Salary%20Slip&name=${encodeURIComponent(slipName)}&format=Standard&no_letterhead=0`;
    window.open(url, "_blank");
  };

  const columns: ColumnDef<SalarySlip>[] = [
    {
      accessorKey: "name",
      header: "Slip ID",
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.getValue("name")}</span>,
    },
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => {
        const start = row.original.start_date;
        const d = new Date(start);
        return <span className="font-medium">{d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>;
      },
    },
    {
      accessorKey: "gross_pay",
      header: "Gross Pay",
      cell: ({ row }) => <span>{formatCurrency(row.getValue("gross_pay"))}</span>,
    },
    {
      accessorKey: "total_deduction",
      header: "Deductions",
      cell: ({ row }) => {
        const val = row.getValue("total_deduction") as number;
        return <span className="text-rose-600 dark:text-rose-400">{val > 0 ? `-${formatCurrency(val)}` : "—"}</span>;
      },
    },
    {
      accessorKey: "net_pay",
      header: "Net Pay",
      cell: ({ row }) => <span className="font-bold text-foreground">{formatCurrency(row.getValue("net_pay"))}</span>,
    },
  ];

  const hrColumns: ColumnDef<any>[] = [
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }) => <span className="font-medium">{row.getValue("employee_name")}</span>,
    },
    {
      accessorKey: "posting_date",
      header: "Posting Date",
      cell: ({ row }) => {
        const d = new Date(row.getValue("posting_date"));
        return <span>{d.toLocaleDateString('en-IN')}</span>;
      },
    },
    {
      accessorKey: "net_pay",
      header: "Net Pay",
      cell: ({ row }) => <span className="font-bold">{formatCurrency(row.getValue("net_pay"))}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isDraft = status === "Draft";
        return (
          <Badge variant="outline" className={cn(
            "font-semibold",
            isDraft ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
          )}>
            {status}
          </Badge>
        );
      },
    }
  ];

  const chartData = React.useMemo(() => {
    if (!data?.records) return [];

    // Sort oldest first for chart
    const sorted = [...data.records].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return sorted.map(r => {
      const d = new Date(r.start_date);
      return {
        name: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        value: r.net_pay,
      };
    });
  }, [data]);

  const hrStats = React.useMemo(() => {
    if (!data?.hr_analytics) return [];
    const a = data.hr_analytics;
    return [
      {
        title: "Total Payroll (MTD)",
        value: formatCurrency(a.total_payroll || 0),
        icon: Wallet,
        description: "Approved only",
        variant: "info",
      },
      {
        title: "Employees Paid",
        value: a.employees_paid.toString(),
        icon: Users,
        description: "This Month",
        variant: "success",
      },
      {
        title: "Pending Salary Slips",
        value: a.pending_slips.toString(),
        icon: FileCheck,
        description: "Drafts",
        variant: "warning",
      },
      {
        title: "Pending Reimbursements",
        value: a.pending_reimbursements.toString(),
        icon: Banknote,
        description: "Action Required",
        variant: "warning",
      },
    ] as const;
  }, [data]);

  const renderHRDashboard = () => {
    if (!data?.hr_analytics) return null;
    const a = data.hr_analytics;

    return (
      <div className="space-y-8 mt-6">
        <div className="auto-grid auto-grid-md">
          {hrStats.map((stat, i) => (
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
                title="Payroll Trend (Last 6 Months)"
                type="bar"
                data={a.salary_trend || []}
                colors={["#0d9488"]}
                height={280}
              />
              <ChartCard
                title="Department Payroll"
                type="donut"
                data={a.department_distribution || []}
                colors={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"]}
                height={280}
              />
            </div>

            <Card className="rounded-2xl border-none bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Company Salary Slips</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={hrColumns}
                  data={a.recent_slips || []}
                  pageSize={5}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-none bg-card shadow-sm p-6 overflow-hidden relative">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/cadesk365/salary-slip/new">
                  <Button variant="outline" className="w-full justify-start h-12">
                    <FileCheck className="mr-2 h-4 w-4" /> Generate Slips
                  </Button>
                </Link>
                <Link href="/hrms/expenses">
                  <Button variant="outline" className="w-full justify-start h-12">
                    <Banknote className="mr-2 h-4 w-4" /> Review Reimbursements
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeView = () => (
    <div className="grid lg:grid-cols-3 gap-8 items-start mt-6">
      <div className="lg:col-span-2 space-y-4">
        <DataTable
          columns={columns}
          data={data?.records || []}
          onRowClick={setSelectedSlip}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <div className="rounded-xl border bg-card p-6 shadow-sm overflow-hidden h-[180px]">
              <Skeleton className="h-4 w-32 mb-4 rounded" />
              <Skeleton className="h-4 w-24 mb-6 rounded" />
              <Skeleton className="h-8 w-40 mb-6 rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </>
        ) : (
          <>
            {chartData.length > 0 && (
              <ChartCard
                title="My Net Pay Trend"
                type="line"
                data={chartData}
                colors={["#0d9488"]}
                height={280}
              />
            )}

            {data?.records && data.records.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm overflow-hidden relative">
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Latest Salary</h3>
                <div className="mb-1 text-sm font-medium">
                  {new Date(data.records[0].start_date).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
                <div className="text-3xl font-bold tracking-tight mb-6">
                  {formatCurrency(data.records[0].net_pay)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.is_hr_manager ? "Payroll & Salary Dashboard" : "My Salary Slips"}
        description={data?.is_hr_manager ? "Company-wide payroll analytics and salary management." : "View and track your monthly salary records."}
      />

      {!isLoading && data?.is_hr_manager ? renderHRDashboard() : renderEmployeeView()}

      <DetailDrawer
        open={!!selectedSlip}
        onOpenChange={(o) => !o && setSelectedSlip(null)}
        title={`Salary Slip: ${selectedSlip ? new Date(selectedSlip.start_date).toLocaleString('en-IN', { month: 'long', year: 'numeric' }) : ""}`}
        subtitle={`Ref: ${selectedSlip?.name}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedSlip(null)}>Close</Button>
          </div>
        }
      >
        {selectedSlip && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg border bg-muted/20">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Start Date</div>
                <div className="font-medium">{selectedSlip.start_date}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">End Date</div>
                <div className="font-medium">{selectedSlip.end_date}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Posting Date</div>
                <div className="font-medium">{selectedSlip.posting_date}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/30">
                <h3 className="font-semibold text-foreground">Earnings & Deductions Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Gross Earnings</span>
                  <span className="font-medium">{formatCurrency(selectedSlip.gross_pay)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Deductions</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">-{formatCurrency(selectedSlip.total_deduction)}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-border/40 flex justify-between items-center">
                  <span className="font-semibold">Net Pay</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedSlip.net_pay)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
