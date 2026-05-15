"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Plus, RefreshCcw, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { FilterBuilder } from "@/components/shared/filter-builder";
import { getDoctypeList, getDoctypeCount } from "@/lib/api/doctype";
import { Checkbox } from "@/components/ui/checkbox";
import { getRecordRoute, getNewRecordRoute } from "@/lib/utils/route";
import { LinkDisplay } from "@/components/shared/link-display";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SortingState } from "@tanstack/react-table";
import type { DocType, DocField } from "@/types/frappe";
import type { DocTypePermissions } from "@/lib/api/permissions";

interface DynamicListProps {
  doctypeMeta: DocType;
  permissions: DocTypePermissions;
}

export function DynamicList({ doctypeMeta, permissions }: DynamicListProps) {
  const router = useRouter();

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<any[]>([]);

  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  // Extract fields that should be in list view
  const listFields = React.useMemo(() => {
    return doctypeMeta.fields.filter((f) => f.in_list_view === 1 || f.in_standard_filter === 1);
  }, [doctypeMeta]);

  // Extract fields that should be shown as list filters
  const listFilterFields = React.useMemo(() => {
    return doctypeMeta.fields.filter((f) => f.in_standard_filter === 1);
  }, [doctypeMeta]);

  // Handle server-side filter changes
  const handleFilterChange = React.useCallback((fieldname: string, value: string, fieldtype: string) => {
    setFilterValues(prev => ({ ...prev, [fieldname]: value }));
    setFilters(prev => {
      const newFilters = prev.filter(f => f[0] !== fieldname);
      if (value && value !== "all") {
        if (fieldtype === "Select" || fieldtype === "Date") {
          newFilters.push([fieldname, "=", value]);
        } else {
          newFilters.push([fieldname, "like", `%${value}%`]);
        }
      }
      return newFilters;
    });
    setPageIndex(0); // Reset to first page
  }, []);

  const customFilterNode = React.useMemo(() => {
    if (listFilterFields.length === 0) return null;
    return (
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {listFilterFields.map((f) => {
          if (f.fieldtype === "Select") {
            const options = (f.options || "").split("\n").filter(Boolean);
            return (
              <div key={f.fieldname} className="relative shrink-0 w-[180px]">
                <Select
                  value={filterValues[f.fieldname] || ""}
                  onValueChange={(val) => handleFilterChange(f.fieldname, val === "all" ? "" : val, f.fieldtype)}
                >
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder={`Select ${f.label || f.fieldname}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (f.fieldtype === "Date") {
            return (
              <div key={f.fieldname} className="relative shrink-0">
                <input
                  type="date"
                  value={filterValues[f.fieldname] || ""}
                  onChange={(e) => handleFilterChange(f.fieldname, e.target.value, f.fieldtype)}
                  className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            );
          }

          return (
            <div key={f.fieldname} className="relative shrink-0">
              <input
                placeholder={`Filter ${f.label || f.fieldname}...`}
                value={filterValues[f.fieldname] || ""}
                onChange={(e) => handleFilterChange(f.fieldname, e.target.value, f.fieldtype)}
                className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          );
        })}
      </div>
    );
  }, [listFilterFields, filterValues, handleFilterChange]);

  // Construct column definitions dynamically
  const columns = React.useMemo<ColumnDef<any, any>[]>(() => {
    const cols: ColumnDef<any, any>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium text-primary cursor-pointer hover:underline">
            {row.original.name}
          </div>
        ),
      },
    ];

    listFields.forEach((field) => {
      // Avoid duplicate "name" if it somehow gets included
      if (field.fieldname === "name") return;

      cols.push({
        accessorKey: field.fieldname,
        header: field.label || field.fieldname,
        cell: ({ row }) => {
          const val = row.original[field.fieldname];
          if (val === undefined || val === null || val === "") return <span className="text-muted-foreground">-</span>;

          if (field.fieldtype === "Link") {
            return <LinkDisplay doctype={field.options} value={val} fallback={String(val)} />;
          }
          if (field.fieldtype === "Dynamic Link") {
            const dynamicDoctype = row.original[field.options || ""];
            return <LinkDisplay doctype={dynamicDoctype} value={val} fallback={String(val)} />;
          }

          // Basic field type formatting
          if (field.fieldtype === "Check") {
            return val ? "Yes" : "No";
          }
          if (field.fieldtype === "Date") {
            return new Date(val).toLocaleDateString();
          }
          if (field.fieldtype === "Currency") {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
          }
          return <span>{String(val)}</span>;
        },
      });
    });

    return cols;
  }, [listFields]);


  // Determine fields to fetch
  const fetchFields = React.useMemo(() => {
    const flds = ["name"];
    listFields.forEach(f => {
      if (!flds.includes(f.fieldname)) {
        flds.push(f.fieldname);
      }
    });
    return flds;
  }, [listFields]);

  // Data fetching
  const order_by = sorting.length ? `${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}` : "modified desc";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctype-list", doctypeMeta.name, pageIndex, pageSize, order_by, filters],
    queryFn: () => getDoctypeList(doctypeMeta.name, fetchFields, filters, pageIndex * pageSize, pageSize, order_by),
  });

  const { data: totalRecords } = useQuery({
    queryKey: ["doctype-count", doctypeMeta.name, filters],
    queryFn: () => getDoctypeCount(doctypeMeta.name, filters),
  });


  return (
    <div className="space-y-6 fluid-container pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-5 rounded-2xl border border-border/30 shadow-sm">
        <PageHeader
          title={doctypeMeta.name}
          description={`Manage ${doctypeMeta.name} records`}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* <FilterBuilder doctypeMeta={doctypeMeta} filters={filters} onChange={(f) => { setFilters(f); setPageIndex(0); }} /> */}

          {permissions.export && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/cadesk365/data-export`)} className="rounded-full">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {/* {permissions.import && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/cadesk365/data-import`)} className="rounded-full">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )} */}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {permissions.create && (
            <Button size="sm" onClick={() => router.push(getNewRecordRoute(doctypeMeta.name))} className="rounded-full !bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Add {doctypeMeta.name}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data || []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          searchKey="name"
          customFilterNode={customFilterNode}
          manualPagination={true}
          pageCount={totalRecords ? Math.ceil(totalRecords / pageSize) : 1}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          totalRecords={totalRecords}
          manualSorting={true}
          sorting={sorting}
          onSortingChange={setSorting}
          onRowClick={(row) => router.push(getRecordRoute(doctypeMeta.name, row.name))}
          emptyTitle={`No ${doctypeMeta.name}s found`}
          emptyDescription="Create a new record to get started."
          renderGridCard={(row) => (
            <div
              onClick={() => router.push(getRecordRoute(doctypeMeta.name, row.name))}
              className="group flex flex-col gap-3 p-5 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base truncate group-hover:text-primary transition-colors">{row.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doctypeMeta.name}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-3 pt-4 border-t border-border/20">
                {listFields.filter(f => f.fieldname !== 'name').slice(0, 4).map(field => {
                  const val = row[field.fieldname];

                  let renderedVal: React.ReactNode = <span className="text-sm font-medium truncate">{val !== undefined && val !== null && val !== "" ? String(val) : '-'}</span>;

                  if (val !== undefined && val !== null && val !== "") {
                    if (field.fieldtype === "Link") {
                      renderedVal = <LinkDisplay doctype={field.options} value={val} fallback={String(val)} className="text-sm font-medium truncate" />;
                    } else if (field.fieldtype === "Dynamic Link") {
                      const dynamicDoctype = row[field.options || ""];
                      renderedVal = <LinkDisplay doctype={dynamicDoctype} value={val} fallback={String(val)} className="text-sm font-medium truncate" />;
                    }
                  }

                  return (
                    <div key={field.fieldname} className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{field.label || field.fieldname}</span>
                      {renderedVal}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
