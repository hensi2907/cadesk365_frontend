"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getHrmsData, doEmployeeCheckin } from "@/lib/api/hrms";
import type { CheckinRecord } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { LogIn, LogOut, Clock, Loader2, List } from "lucide-react";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { getListRoute } from "@/lib/utils/route";
import { useRouter } from "next/navigation";

export default function CheckinPage() {
  const router = useRouter();
  const [selectedCheckin, setSelectedCheckin] = React.useState<CheckinRecord | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrms_checkin"],
    queryFn: () => getHrmsData("checkin") as any,
  });

  const checkinMutation = useMutation({
    mutationFn: async (type: "IN" | "OUT") => {
      return doEmployeeCheckin(type);
    },
    onSuccess: () => refetch(),
  });

  const columns: ColumnDef<CheckinRecord>[] = [
    {
      accessorKey: "time",
      header: "Timestamp",
      cell: ({ row }) => {
        const d = new Date(row.getValue("time"));
        return <span className="font-medium">{d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>;
      },
    },
    {
      accessorKey: "log_type",
      header: "Action",
      cell: ({ row }) => {
        const type = row.getValue("log_type") as string;
        if (type === "IN") {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20">
              <LogIn className="h-3 w-3" /> Check In
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20">
            <LogOut className="h-3 w-3" /> Check Out
          </span>
        );
      },
    },
    {
      accessorKey: "device_id",
      header: "Device / IP",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("device_id") || "Web Browser"}</span>,
    },
  ];

  const handleAction = async () => {
    if (!data?.next_action) return;
    await checkinMutation.mutateAsync(data.next_action);
  };

  const isWorking = data?.last_log_type === "IN";

  const lastInRecord = data?.records?.find((r: any) => r.log_type === "IN");
  let elapsedTimeStr = "";
  if (isWorking && lastInRecord) {
    const diffMs = currentTime.getTime() - new Date(lastInRecord.time).getTime();
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      elapsedTimeStr = `${hours}h ${mins}m`;
    }
  }

  return (
    <div className="space-y-8 fluid-container">
      <PageHeader
        title="Check In / Out"
        description="Log your daily attendance directly from the portal."
      >
        <Button onClick={() => router.push(getListRoute("Employee Checkin"))} variant="outline">
          <List className="mr-2 h-4 w-4" />
          View Full Log
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Action Card */}
        <div className="rounded-xl border bg-card p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="mb-8">
            <div className="text-muted-foreground font-medium tracking-widest uppercase text-xs mb-2">Current Time</div>
            <div className="text-5xl font-bold tracking-tight text-foreground font-mono">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-muted-foreground mt-2 font-medium">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="text-sm font-medium text-center">
              <div>
                Current Status:{" "}
                {isLoading ? (
                  <span className="text-muted-foreground animate-pulse">Loading...</span>
                ) : isWorking ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Working</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Checked Out</span>
                )}
              </div>
              {isWorking && elapsedTimeStr && (
                <div className="text-xs text-muted-foreground mt-1 font-normal">
                  Checked in • {elapsedTimeStr}
                </div>
              )}
            </div>

            <Button
              size="lg"
              className={`w-full max-w-xs h-14 text-base font-semibold shadow-md ${data?.next_action === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              onClick={handleAction}
              disabled={checkinMutation.isPending || isLoading}
            >
              {checkinMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : data?.next_action === "IN" ? (
                <LogIn className="mr-2 h-5 w-5" />
              ) : (
                <LogOut className="mr-2 h-5 w-5" />
              )}
              {checkinMutation.isPending ? "Processing..." : `Check ${data?.next_action || "In"}`}
            </Button>

            <p className="text-xs text-muted-foreground mt-2">
              Make sure to allow location access if prompted by your browser.
            </p>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <DataTable
              columns={columns}
              data={(data?.records || []).slice(0, 5)}
              onRowClick={setSelectedCheckin}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
              emptyTitle="No recent logs"
              emptyDescription="You haven't checked in or out recently."
            />
          </div>
        </div>
      </div>

      <DetailDrawer
        open={!!selectedCheckin}
        onOpenChange={(o) => !o && setSelectedCheckin(null)}
        title="Check-in Record"
        subtitle={selectedCheckin ? new Date(selectedCheckin.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ""}
      >
        {selectedCheckin && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg border bg-muted/20">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Action</div>
                <div className="font-medium">
                  {selectedCheckin.log_type === "IN" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                      <LogIn className="h-3 w-3" /> Check In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                      <LogOut className="h-3 w-3" /> Check Out
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Device ID / IP</div>
                <div className="font-medium">{selectedCheckin.device_id || "Web Browser"}</div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
