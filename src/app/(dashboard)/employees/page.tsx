"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterOption } from "@/components/shared/filter-bar";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeList } from "@/lib/api/clients";
import type { Employee } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { Users, BarChart3, Calendar, ClipboardList, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getRecordRoute } from "@/lib/utils/route";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
  const router = useRouter();
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const { data: employees, isLoading, isError, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployeeList(),
    staleTime: 5 * 60 * 1000,
  });

  const employeeList = employees || [];

  const filteredEmployees = React.useMemo(() => {
    return employeeList.filter((emp) => {
      if (filters.search && !emp.employee_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.department && emp.department !== filters.department) return false;
      if (filters.designation && !emp.designation?.toLowerCase().includes(filters.designation.toLowerCase())) return false;
      return true;
    });
  }, [employeeList, filters]);

  const stats = React.useMemo(() => {
    const total = filteredEmployees.length;
    const totalTasks = filteredEmployees.reduce((sum, e) => sum + (e.open_tasks || 0), 0);
    const avgTasks = total > 0 ? Math.round(totalTasks / total) : 0;
    const departments = new Set(filteredEmployees.map((e) => e.department).filter(Boolean)).size;
    return { total, totalTasks, avgTasks, departments };
  }, [filteredEmployees]);

  const workloadData = React.useMemo(() => {
    return filteredEmployees
      .map((e) => {
        const nameParts = (e.employee_name || e.name || "Unknown").split(" ");
        const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : nameParts[0];
        return { name: shortName, value: e.open_tasks || 0 };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredEmployees]);

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "name", header: "ID", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.getValue("name")}</span> },
    { accessorKey: "employee_name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("employee_name")}</span> },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "department", header: "Department" },
    {
      accessorKey: "open_tasks", header: "Open Tasks",
      cell: ({ row }) => {
        const val = row.getValue("open_tasks") as number;
        return <span className={val > 5 ? "font-medium text-amber-600 dark:text-amber-400" : "font-medium text-emerald-600 dark:text-emerald-400"}>{val}</span>;
      },
    },
  ];

  const filterOptions: FilterOption[] = [
    { key: "designation", label: "Designation", type: "search", placeholder: "Search Designation..." },
    {
      key: "department", label: "Department", type: "select",
      options: Array.from(new Set(employeeList.map((e) => e.department).filter(Boolean))).map((d) => ({ label: String(d), value: String(d) })),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <PageHeader title="Team" description="Manage team members and view workload.">
        {/* <Button onClick={() => router.push("/hrms/attendance")} size="sm" className="gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          HRMS
        </Button> */}
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          [
            { label: "Total Employees", value: stats.total, icon: Users, color: "text-primary bg-primary/10", href: "/employees" },
            { label: "Open Tasks", value: stats.totalTasks, icon: ClipboardList, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10", href: "/tasks" },
            { label: "Avg per Person", value: stats.avgTasks, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", href: "/employees" },
            { label: "Departments", value: stats.departments, icon: BarChart3, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10", href: "/employees" },
          ].map((s) => (
            <Link href={s.href} key={s.label} className="group relative overflow-hidden rounded-lg border bg-card p-4 flex items-center gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <div className={cn("relative h-10 w-10 rounded-lg flex items-center justify-center shrink-0", s.color)}><s.icon className="h-5 w-5" /></div>
              <div className="relative">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Workload Distribution</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded" />
          ) : workloadData.length > 0 ? (
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-full" style={{ width: Math.max(100, workloadData.length * 4.5) + '%' }}>
                <ChartCard
                  title=""
                  type="bar"
                  data={workloadData}
                  colors={["#f59e0b"]}
                  height={280}
                  minWidth={Math.max(800, workloadData.length * 45)}
                  className="border-0 shadow-none p-0"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-12">No data available for the selected filters.</div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            {/* <h2 className="text-sm font-medium text-foreground">Employee Directory</h2> */}
            <FilterBar filters={filterOptions} activeFilters={filters} onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))} onReset={() => setFilters({})} />
          </div>
          <div className="mt-3">
            <DataTable columns={columns} data={filteredEmployees} searchKey="employee_name" onRowClick={(row) => router.push(getRecordRoute("Employee", row.name))} isLoading={isLoading} isError={isError} onRetry={refetch} />
          </div>
        </div>
      </div>
    </div>
  );
}
