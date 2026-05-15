"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getHrmsData } from "@/lib/api/hrms";
import { getDoctypeList } from "@/lib/api/doctype";
import type { AttendanceRecord } from "@/types/api";
import { LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function KpiCard({ title, value, valueClass, isLoading }: { title: string, value: string | number, valueClass?: string, isLoading?: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-[90px] w-full rounded-xl" />;
  }
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
      <p className={cn("text-[28px] font-bold tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function AttendanceGridCard({ record, onClick }: { record: AttendanceRecord, onClick: () => void }) {
  const dateStr = record.attendance_date
    ? format(new Date(record.attendance_date), "EEE, dd MMM")
    : "—";

  let badgeClass = "bg-muted text-muted-foreground";
  if (record.status === "Present") badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (record.status === "Absent") badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  if (record.status === "Half Day") badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (record.status === "Work From Home") badgeClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  if (record.status === "On Leave") badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";

  const workingHours = record.working_hours && record.working_hours > 0 ? `${record.working_hours.toFixed(1)}h` : "—";

  return (
    <div
      onClick={onClick}
      className="fluid container flex cursor-pointer flex-col gap-[6px] rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
    >
      <p className="text-[13px] font-bold">{dateStr}</p>
      <div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold", badgeClass)}>
          {record.status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[12px] text-muted-foreground font-medium">{workingHours}</p>
        {record.late_entry === 1 && <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full dark:bg-rose-900/30">Late</span>}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ["hrms_attendance", month, year],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => getHrmsData("attendance", month, year) as any,
  });

  const { data: requestsData, isLoading: reqLoading } = useQuery({
    queryKey: ["attendance_requests"],
    queryFn: () => getDoctypeList("Attendance Request", ["name", "from_date", "to_date", "reason", "half_day", "docstatus"]),
  });

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const records: AttendanceRecord[] = data?.records || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Attendance"
        description="View your monthly attendance records."
      >
        <Button onClick={() => router.push("/cadesk365/attendance-request/new")} className="!bg-primary/80 hover:bg-primary/60 text-white">
          <LogIn className="mr-2 h-4 w-4" />
          Request Attendance
        </Button>
      </PageHeader>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-card p-2 rounded-xl border shadow-sm">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="text-muted-foreground hover:text-foreground font-medium">
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <h3 className="text-[15px] font-bold">{data?.month_label || format(currentDate, "MMMM yyyy")}</h3>
        <Button variant="ghost" size="sm" onClick={handleNextMonth} className="text-muted-foreground hover:text-foreground font-medium">
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="auto-grid auto-grid-xs">
        <KpiCard title="Present" value={data?.present || 0} valueClass="text-emerald-600 dark:text-emerald-500" isLoading={isLoading} />
        <KpiCard title="Absent" value={data?.absent || 0} valueClass="text-rose-600 dark:text-rose-500" isLoading={isLoading} />
        <KpiCard title="WFH" value={data?.work_from_home || 0} valueClass="text-teal-600 dark:text-teal-500" isLoading={isLoading} />
        <KpiCard title="Half Day" value={data?.half_day || 0} valueClass="text-amber-600 dark:text-amber-500" isLoading={isLoading} />
        <KpiCard title="Total" value={data?.total || 0} valueClass="text-foreground" isLoading={isLoading} />
      </div>

      <div className="mt-8 space-y-8">
        {/* Attendance Log Grid */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
            <h3 className="text-[15px] font-bold text-foreground">Attendance Log</h3>
            <span className="text-[12px] font-medium text-muted-foreground">{records.length} entries</span>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="auto-grid auto-grid-sm">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h[100px] w-full rounded-2xl" />
                ))}
              </div>
            ) : records.length > 0 ? (
              <div className="auto-grid auto-grid-sm">
                {records.map((record, i) => (
                  <AttendanceGridCard
                    key={i}
                    record={record}
                    onClick={() => router.push(`/cadesk365/attendance/${record.name}`)}

                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                No attendance records for the selected period.
              </div>
            )}
          </div>
        </section>

        {/* Attendance Requests Table */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
            <h3 className="text-[15px] font-bold text-foreground">Attendance Requests</h3>
          </div>
          <div className="p-0">
            <DataTable
              columns={[
                { accessorKey: "name", header: "ID", cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.getValue("name")}</span> },
                { accessorKey: "from_date", header: "From Date" },
                { accessorKey: "to_date", header: "To Date" },
                { accessorKey: "reason", header: "Reason" },
                { accessorKey: "half_day", header: "Half Day", cell: ({ row }) => row.getValue("half_day") ? "Yes" : "No" },
                {
                  accessorKey: "docstatus",
                  header: "Status",
                  cell: ({ row }) => {
                    const status = row.getValue("docstatus") as number;
                    if (status === 0) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Draft</span>;
                    if (status === 1) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Submitted</span>;
                    if (status === 2) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Cancelled</span>;
                    return status;
                  }
                }
              ]}
              data={requestsData || []}
              isLoading={reqLoading}
              emptyTitle="No attendance requests"
              emptyDescription="You haven't submitted any attendance requests."
              onRowClick={(row) => router.push(`/cadesk365/attendance-request/${row.name}`)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

