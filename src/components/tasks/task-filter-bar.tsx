"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TaskFilter, TaskFilterBarProps, TaskStatus, TaskPriority } from "@/types/task-management";

export function TaskFilterBar({
  filters,
  onFiltersChange,
  availableFilters,
  onReset,
}: TaskFilterBarProps) {
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.assigned_to && filters.assigned_to.length > 0) count++;
    if (filters.customer && filters.customer.length > 0) count++;
    if (filters.date_range) count++;
    return count;
  }, [filters]);

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handlePriorityChange = (priority: TaskPriority, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    });
  };

  const handleAssigneeChange = (assignee: string, checked: boolean) => {
    const currentAssignees = filters.assigned_to || [];
    const newAssignees = checked
      ? [...currentAssignees, assignee]
      : currentAssignees.filter(a => a !== assignee);
    
    onFiltersChange({
      ...filters,
      assigned_to: newAssignees.length > 0 ? newAssignees : undefined,
    });
  };

  const handleCustomerChange = (customer: string, checked: boolean) => {
    const currentCustomers = filters.customer || [];
    const newCustomers = checked
      ? [...currentCustomers, customer]
      : currentCustomers.filter(c => c !== customer);
    
    onFiltersChange({
      ...filters,
      customer: newCustomers.length > 0 ? newCustomers : undefined,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {/* Status Filter */}
          <div className="p-3 border-b border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Status</div>
            <div className="space-y-1">
              {availableFilters.statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status?.includes(status) || false}
                  onCheckedChange={(checked) => handleStatusChange(status, !!checked)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="p-3 border-b border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Priority</div>
            <div className="space-y-1">
              {availableFilters.priorities.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filters.priority?.includes(priority) || false}
                  onCheckedChange={(checked) => handlePriorityChange(priority, !!checked)}
                >
                  {priority}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          {availableFilters.assignees.length > 0 && (
            <div className="p-3 border-b border-border/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">Assigned To</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableFilters.assignees.map((assignee) => (
                  <DropdownMenuCheckboxItem
                    key={assignee}
                    checked={filters.assigned_to?.includes(assignee) || false}
                    onCheckedChange={(checked) => handleAssigneeChange(assignee, !!checked)}
                  >
                    {assignee.split("@")[0]}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>
          )}

          {/* Customer Filter */}
          {availableFilters.customers.length > 0 && (
            <div className="p-3 border-b border-border/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">Customer</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableFilters.customers.map((customer) => (
                  <DropdownMenuCheckboxItem
                    key={customer}
                    checked={filters.customer?.includes(customer) || false}
                    onCheckedChange={(checked) => handleCustomerChange(customer, !!checked)}
                  >
                    {customer}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full justify-start"
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Reset All Filters
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Badges */}
      <div className="flex items-center gap-1 flex-wrap">
        {filters.status?.map((status) => (
          <Badge
            key={status}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600"
            onClick={() => handleStatusChange(status, false)}
          >
            {status}
            <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.priority?.map((priority) => (
          <Badge
            key={priority}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600"
            onClick={() => handlePriorityChange(priority, false)}
          >
            {priority}
            <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.assigned_to?.map((assignee) => (
          <Badge
            key={assignee}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600"
            onClick={() => handleAssigneeChange(assignee, false)}
          >
            {assignee.split("@")[0]}
            <X className="h-3 w-3" />
          </Badge>
        ))}
        {filters.customer?.map((customer) => (
          <Badge
            key={customer}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600"
            onClick={() => handleCustomerChange(customer, false)}
          >
            {customer}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      </div>
    </div>
  );
}
