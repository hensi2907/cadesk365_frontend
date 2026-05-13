"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  isLoading = false,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalRecords === 0) return null;

  const startRecord = currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalRecords);
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 pt-3", className)}>
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startRecord}</span>–<span className="font-medium text-foreground">{endRecord}</span> of <span className="font-medium text-foreground">{totalRecords}</span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Page {currentPage + 1} / {totalPages}</span>
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => onPageChange(0)} disabled={!canPrevious || isLoading} aria-label="First page"><ChevronsLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => onPageChange(currentPage - 1)} disabled={!canPrevious || isLoading} aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => onPageChange(currentPage + 1)} disabled={!canNext || isLoading} aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => onPageChange(totalPages - 1)} disabled={!canNext || isLoading} aria-label="Last page"><ChevronsRight className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  );
}
