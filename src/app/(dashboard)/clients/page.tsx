"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterOption } from "@/components/shared/filter-bar";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Link2, Upload, Building2, ShieldCheck, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { getClientDetail } from "@/lib/api/clients";
import type { ClientSummary } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils/sanitize";

export default function ClientsPage() {
  const router = useRouter();
  const [selectedClientStr, setSelectedClientStr] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const { data: dashboardData, isLoading, isError, refetch } = useDashboard();



  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["client_detail", selectedClientStr || ""],
    queryFn: () => getClientDetail(selectedClientStr || ""),
    enabled: !!selectedClientStr,
    staleTime: 1000 * 60 * 2,
  });

  const clients = React.useMemo(() => dashboardData?.client_summary || [], [dashboardData]);

  const filteredClients = React.useMemo(() => {
    return clients.filter((client: ClientSummary) => {
      if (filters.search && !client.client.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [clients, filters]);

  const totalClients = clients.length;
  const totalActive = clients.reduce((sum: number, c: ClientSummary) => sum + c.active, 0);

  const chartData = React.useMemo(() => {
    return clients
      .map((c: ClientSummary) => ({ name: c.client.slice(0, 12), value: c.active }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8);
  }, [clients]);

  const columns: ColumnDef<ClientSummary>[] = [
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue("client")}</span>,
    },
    {
      accessorKey: "active",
      header: "Active",
      cell: ({ row }) => <span className="font-medium text-amber-600 dark:text-amber-400">{row.getValue("active")}</span>,
    },
    {
      accessorKey: "completed",
      header: "Completed",
      cell: ({ row }) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{row.getValue("completed")}</span>,
    },
    {
      accessorKey: "overdue",
      header: "Overdue",
      cell: ({ row }) => {
        const val = row.getValue("overdue") as number;
        return <span className={val > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>{val}</span>;
      },
    },
  ];

  const filterOptions: FilterOption[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Search clients..." },
  ];

  return (
    <div className="space-y-5 fluid-container">
      <PageHeader title="Clients" description="Manage clients and view compliance status.">
        <Button onClick={() => router.push("/clients/onboard")} size="sm" className="gap-1.5 !bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Onboard Client
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="auto-grid auto-grid-md">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          [
            { label: "Total Clients", value: totalClients, icon: Users, color: "text-primary bg-primary/10" },
            { label: "Active", value: totalActive, icon: ShieldCheck, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
            { label: "Completed", value: clients.reduce((sum: number, c: ClientSummary) => sum + c.completed, 0), icon: ClipboardCheck, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
            { label: "Overdue", value: clients.reduce((sum: number, c: ClientSummary) => sum + c.overdue, 0), icon: Building2, color: "text-red-600 dark:text-red-400 bg-red-500/10" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chart + Table */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Compliance Load</h2>
            {isLoading ? (
              <Skeleton className="h-56 w-full rounded" />
            ) : chartData.length > 0 ? (
              <ChartCard title="" type="bar" data={chartData} colors={["#3b82f6"]} height={220} className="border-0 shadow-none p-0" />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">No data available.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">All Clients</h2>
            {/* <FilterBar filters={filterOptions} activeFilters={filters} onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))} onReset={() => setFilters({})} /> */}
            <div className="mt-3">
              <DataTable columns={columns} data={filteredClients} searchKey="client" onRowClick={(row: ClientSummary) => setSelectedClientStr(row.client)} isLoading={isLoading} isError={isError} onRetry={refetch} pageSize={10} pageSizeOptions={[10, 20, 50]} />
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        open={!!selectedClientStr}
        onOpenChange={(o) => !o && setSelectedClientStr(null)}
        title={selectedClientStr || ""}
        subtitle={detailData?.customer_type}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedClientStr(null)}>Close</Button>
            <Button size="sm">Client Dashboard</Button>
          </div>
        }
      >
        {detailLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        ) : detailData ? (
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">Contact Information</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {[
                  { label: "Email", value: detailData.email_id },
                  { label: "Phone", value: detailData.mobile_no },
                  { label: "GSTIN", value: detailData.gstin },
                  { label: "PAN", value: detailData.pan },
                  { label: "Entity Type", value: detailData.custom_business_entity },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-xs text-muted-foreground mb-0.5">{f.label}</div>
                    <div className="font-medium text-sm">{f.value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Active Trackers</h3>
              {detailData.trackers?.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-lg text-center">No active trackers found.</div>
              ) : (
                <div className="space-y-1.5">
                  {detailData.trackers?.map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm">{t.compliance}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Due: {t.due_date}</div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Open Tasks</h3>
              {detailData.open_tasks?.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-lg text-center">No open tasks found.</div>
              ) : (
                <div className="space-y-1.5">
                  {detailData.open_tasks?.map((t: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1.5 border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm text-primary">{t.name}</div>
                        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded">{t.allocated_to}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.description) }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
