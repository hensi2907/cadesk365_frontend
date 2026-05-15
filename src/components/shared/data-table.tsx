"use client";

import * as React from "react";
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, SlidersHorizontal, LayoutList, LayoutGrid, ArrowUp, ArrowDown } from "lucide-react";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { Pagination } from "./pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  hideToolbar?: boolean;
  customFilterNode?: React.ReactNode;
  renderGridCard?: (row: TData) => React.ReactNode;
  initialViewMode?: "list" | "grid";
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  rowSelection?: any;
  onRowSelectionChange?: (selection: any) => void;
  totalRecords?: number;
}

export function DataTable<TData, TValue>({
  columns, data, searchKey, searchPlaceholder = "Search...", onRowClick,
  isLoading, isError, onRetry,
  emptyTitle = "No data found", emptyDescription = "There are no records to display at this time.",
  pageSize: initialPageSize = 10, pageSizeOptions = [10, 20, 50, 100],
  hideToolbar, customFilterNode, renderGridCard, initialViewMode = "list",
  manualPagination, pageCount, pageIndex: controlledPageIndex,
  onPageChange, onPageSizeChange, manualSorting,
  sorting: controlledSorting, onSortingChange,
  rowSelection: controlledRowSelection, onRowSelectionChange,
  totalRecords: controlledTotalRecords,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState({});
  const [internalPageSize, setInternalPageSize] = React.useState(initialPageSize);
  const [internalPageIndex, setInternalPageIndex] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"list" | "grid">(initialViewMode);

  const sorting = controlledSorting !== undefined ? controlledSorting : internalSorting;
  const rowSelection = controlledRowSelection !== undefined ? controlledRowSelection : internalRowSelection;
  const currentPageSize = onPageSizeChange ? initialPageSize : internalPageSize;
  const currentPageIndex = controlledPageIndex !== undefined ? controlledPageIndex : internalPageIndex;

  const table = useReactTable({
    data, columns,
    pageCount: manualPagination ? pageCount : undefined,
    manualPagination, manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      if (controlledSorting === undefined) setInternalSorting(newSorting);
      if (onSortingChange) onSortingChange(newSorting);
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      if (controlledRowSelection === undefined) setInternalRowSelection(newSelection);
      if (onRowSelectionChange) onRowSelectionChange(newSelection);
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({ pageIndex: currentPageIndex, pageSize: currentPageSize }) : updater;
      if (controlledPageIndex === undefined) setInternalPageIndex(newPagination.pageIndex);
      if (!onPageSizeChange) setInternalPageSize(newPagination.pageSize);
      if (onPageChange) onPageChange(newPagination.pageIndex);
      if (onPageSizeChange) onPageSizeChange(newPagination.pageSize);
    },
    initialState: { pagination: { pageSize: initialPageSize } },
    state: {
      sorting, columnFilters, columnVisibility, rowSelection,
      pagination: { pageIndex: currentPageIndex, pageSize: currentPageSize },
    },
  });

  if (isError) {
    return (
      <div className="rounded-lg border p-6">
        <ErrorState onRetry={onRetry} description="Failed to load data." />
      </div>
    );
  }

  const recordsCount = manualPagination ? (controlledTotalRecords || 0) : table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-3">
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {searchKey ? (
              <div className="relative w-full max-w-sm shrink-0">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            ) : null}
            {customFilterNode}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {renderGridCard && (
              <div className="flex bg-muted p-0.5 rounded-md">
                <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id} className="capitalize text-xs"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: Math.min(currentPageSize, 3) }).map((_, idx) => (
                <div key={idx} className="border rounded-xl p-5 bg-card shadow-sm space-y-4">
                  {columns.map((_, colIdx) => (
                    <div key={colIdx} className="space-y-1">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className={cn("border rounded-xl p-5 bg-card shadow-sm space-y-4 transition-all hover:border-primary/30 hover:shadow-md", onRowClick && "cursor-pointer active:bg-accent/50")}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    // Extract header string if possible
                    let headerText = cell.column.id;
                    if (typeof cell.column.columnDef.header === "string") {
                      headerText = cell.column.columnDef.header;
                    }

                    return (
                      <div key={cell.id} className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {headerText.replace(/_/g, " ")}
                        </span>
                        <div className="text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="border rounded-lg p-8 bg-card shadow-sm text-center">
                <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-11 px-4 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground hover:bg-muted/80 transition-colors"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUp className="h-3 w-3" />,
                            desc: <ArrowDown className="h-3 w-3" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: Math.min(currentPageSize, 5) }).map((_, idx) => (
                    <TableRow key={idx}>
                      {columns.map((_, colIdx) => (
                        <TableCell key={colIdx}><div className="h-4 w-full animate-pulse rounded bg-muted" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn("transition-colors hover:bg-muted/40", onRowClick && "cursor-pointer")}
                      onClick={() => onRowClick && onRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 text-[14px]">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-40 text-center">
                      <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {viewMode === "grid" && renderGridCard && (
        <div className="auto-grid auto-grid-xl">
          {isLoading ? (
            Array.from({ length: Math.min(currentPageSize, 4) }).map((_, idx) => (
              <div key={idx} className="h-32 rounded-lg border bg-card animate-pulse" />
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id}>{renderGridCard(row.original)}</div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </div>
          )}
        </div>
      )}

      <Pagination
        currentPage={currentPageIndex}
        totalPages={manualPagination ? pageCount || 1 : table.getPageCount()}
        pageSize={currentPageSize}
        totalRecords={recordsCount}
        isLoading={isLoading}
        onPageChange={(page) => table.setPageIndex(page)}
      />
    </div>
  );
}
