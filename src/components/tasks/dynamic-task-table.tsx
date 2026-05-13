"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { getRecordRoute } from "@/lib/utils/route";
import type { Task, TaskTableProps, TableColumn, TaskStatus, TaskPriority } from "@/types/task-management";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: "bg-blue-50 text-blue-700 border-blue-200",
  Normal: "bg-gray-50 text-gray-700 border-gray-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

const getPriorityIcon = (priority: TaskPriority) => {
  switch (priority) {
    case "Critical": return "🔴";
    case "High": return "🟠";
    case "Normal": return "🟡";
    case "Low": return "🔵";
    default: return "⚪";
  }
};

export function DynamicTaskTable({
  tasks,
  columns,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,

  loading = false,
  readOnly = false,
}: TaskTableProps) {
  const memoizedOnSortChange = React.useCallback(
    (newSort: { field: keyof Task; direction: "asc" | "desc" }) => {
      onSortChange(newSort);
    },
    [onSortChange]
  );

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible }), {})
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: sort.field, desc: sort.direction === "desc" }
  ]);





  const tableColumns: ColumnDef<Task>[] = React.useMemo(() => [

    ...columns.map((col: TableColumn) => ({
      accessorKey: col.key,
      header: ({ column }: any) => (
        <div className="flex items-center space-x-1">
          <span>{col.label}</span>
          {col.sortable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      ),
      cell: ({ row, getValue }: any) => {
        const value: string = getValue();
        const task: Task = row.original;

        switch (col.key) {
          case "status":
            return <StatusBadge status={value as TaskStatus} />;

          case "priority":
            return (
              <div className="flex items-center gap-2">
                <span>{getPriorityIcon(value as TaskPriority)}</span>
                <Badge className={cn("text-xs", PRIORITY_COLORS[value as TaskPriority])}>
                  {value}
                </Badge>
              </div>
            );

          case "description":
            return (
              <div className="max-w-[400px]">
                <p className="font-medium text-sm truncate">{value}</p>
                {task.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.labels.slice(0, 2).map((label: string) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                    {task.labels.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{task.labels.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );

          case "date":
          case "due_date":
            return value ? formatDate(value) : "—";

          case "created_at":
          case "updated_at":
            return value ? formatDate(value) : "—";

          case "allocated_to":
            return (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {value?.split("@")[0]?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm">{value?.split("@")[0] || "Unassigned"}</span>
              </div>
            );

          default:
            return <span className="text-sm">{value || "—"}</span>;
        }
      },
      enableSorting: col.sortable,
      enableHiding: true,
      size: col.width ? parseInt(col.width) : undefined,
    })),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 border-none bg-transparent hover:bg-accent rounded-md flex items-center justify-center" disabled={readOnly}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuItem onClick={() => onTaskSelect?.(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem> */}
            {!readOnly && onTaskEdit && (
              <DropdownMenuItem onClick={() => window.location.href = getRecordRoute("ToDo", row.original.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {/* {!readOnly && onTaskDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onTaskDelete(row.original.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )} */}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [columns, readOnly, onTaskSelect, onTaskEdit, onTaskDelete]);

  const table = useReactTable({
    data: tasks,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // React.useEffect(() => {
  //   if (sorting.length > 0) {
  //     const newSort = {
  //       field: sorting[0].id as keyof Task,
  //       direction: (sorting[0].desc ? "desc" : "asc") as "asc" | "desc",
  //     };
  //     // Only call onSortChange if the sort actually changed
  //     if (sort.field !== newSort.field || sort.direction !== newSort.direction) {
  //       memoizedOnSortChange(newSort);
  //     }
  //   }
  // }, [sorting, sort.field, sort.direction, memoizedOnSortChange]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* <Input
            placeholder="Search tasks..."
            value={(columnFilters.find(f => f.id === "description")?.value as string) ?? ""}
            onChange={(event) =>
              setColumnFilters(prev =>
                prev.filter(f => f.id !== "description").concat({
                  id: "description",
                  value: event.target.value,
                })
              )
            }
            className="max-w-sm"
          /> */}

        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {table
              .getAllColumns()
              .filter((column) => column.id !== "select" && column.id !== "actions")
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columns.find(c => c.key === column.id)?.label || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-4 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/40 transition-colors "
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-[14px] cursor-pointer"
                      onClick={() => window.location.href = getRecordRoute("ToDo", row.original.id)}

                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-muted-foreground">No tasks found</div>
                    <div className="text-sm text-muted-foreground/60">
                      Try adjusting your filters or create a new task
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, tasks.length)} of{" "}
          {tasks.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
