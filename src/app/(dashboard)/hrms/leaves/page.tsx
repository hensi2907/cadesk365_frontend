"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getHrmsData } from "@/lib/api/hrms";
import type { LeaveApplication } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarPlus, Info } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

import { getNewRecordRoute } from "@/lib/utils/route";
import { useRouter } from "next/navigation";

export default function LeavesPage() {
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = React.useState<LeaveApplication | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrms_leaves"],
    queryFn: () => getHrmsData("leaves") as any,
  });

  const columns: ColumnDef<LeaveApplication>[] = [
    {
      accessorKey: "name",
      header: "Ref ID",
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "leave_type",
      header: "Leave Type",
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.getValue("leave_type")}</span>,
    },
    {
      accessorKey: "from_date",
      header: "From Date",
    },
    {
      accessorKey: "to_date",
      header: "To Date",
    },
    {
      accessorKey: "total_leave_days",
      header: "Days",
      cell: ({ row }) => <span className="font-medium">{row.getValue("total_leave_days")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leave Management"
        description="View your leave balances and track applications."
      >
        <Button onClick={() => router.push(getNewRecordRoute("Leave Application"))} className="!bg-primary/80 hover:!bg-primary/60">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Apply Leave
        </Button>
      </PageHeader>

      <div>
        <h3 className="mb-4 text-lg font-medium text-foreground">Current Balances</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 h-[120px] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))
          ) : (
            data?.leave_balances?.map((balance: any, i: number) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-medium">{balance.leave_type}</div>
                  <div className="text-2xl font-bold tracking-tight">{balance.balance}</div>
                </div>
                <ProgressBar
                  value={balance.used}
                  max={balance.allocated}
                  label={`Used: ${balance.used} / ${balance.allocated}`}
                  showValue={false}
                  variant={balance.used / balance.allocated > 0.8 ? "danger" : balance.used / balance.allocated > 0.5 ? "warning" : "success"}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-foreground">Application History</h3>
          <DataTable
            columns={columns}
            data={data?.records || []}
            onRowClick={setSelectedLeave}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Upcoming Holidays</h3>
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-5 space-y-4">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-2/3 rounded mt-4" />
              </div>
            ) : (() => {
              // Filter out weekends (0 = Sunday, 6 = Saturday)
              const validHolidays = (data?.holidays || []).filter((h: any) => {
                const day = new Date(h.holiday_date).getDay();
                return day !== 0 && day !== 6;
              });

              if (validHolidays.length === 0) {
                return (
                  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Info className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No upcoming holidays</p>
                    <p className="text-xs text-muted-foreground">There are no holidays scheduled for the near future.</p>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-border/40">
                  {validHolidays.map((h: any, i: number) => {
                    const holidayDate = new Date(h.holiday_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = holidayDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return (
                      <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4 group">
                        <div className="flex flex-col items-center justify-center min-w-[3rem] p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <span className="text-xs font-semibold uppercase tracking-wider">{holidayDate.toLocaleDateString("en-IN", { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{holidayDate.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{h.description}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{holidayDate.toLocaleDateString("en-IN", { weekday: 'long' })}</span>
                            <span className="w-1 h-1 rounded-full bg-border"></span>
                            <span className={diffDays <= 7 ? "text-amber-500 font-medium" : ""}>
                              {diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <DetailDrawer
        open={!!selectedLeave}
        onOpenChange={(o) => !o && setSelectedLeave(null)}
        title={selectedLeave?.leave_type || "Leave Application"}
        subtitle={`Ref: ${selectedLeave?.name}`}
      >
        {selectedLeave && (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <StatusBadge status={selectedLeave.status} />
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg border bg-muted/20">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">From Date</div>
                <div className="font-medium">{selectedLeave.from_date}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">To Date</div>
                <div className="font-medium">{selectedLeave.to_date}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Days</div>
                <div className="font-medium">{selectedLeave.total_leave_days}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Posting Date</div>
                <div className="font-medium">{selectedLeave.posting_date}</div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
