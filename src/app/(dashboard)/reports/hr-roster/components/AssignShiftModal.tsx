"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getShiftTypes, getEmployeesByDepartment, assignBulkRoster } from "@/lib/api/reports";
import { toast } from "sonner";
import { CalendarDays, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignShiftModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [department, setDepartment] = useState("");
  const [shiftType, setShiftType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  const { data: shifts } = useQuery({
    queryKey: ["shift-types"],
    queryFn: getShiftTypes,
    enabled: open,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", department],
    queryFn: () => getEmployeesByDepartment(department || undefined),
    enabled: open,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && employees) {
      setSelectedEmployees(new Set(employees.map(e => e.name)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleSelect = (employeeId: string, checked: boolean) => {
    const newSet = new Set(selectedEmployees);
    if (checked) {
      newSet.add(employeeId);
    } else {
      newSet.delete(employeeId);
    }
    setSelectedEmployees(newSet);
  };

  const assignMutation = useMutation({
    mutationFn: () => {
      return assignBulkRoster(
        Array.from(selectedEmployees),
        shiftType,
        startDate,
        endDate
      );
    },
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(`Successfully assigned shifts to ${res.assigned_count} employees.`);
        if (res.errors && res.errors.length > 0) {
          toast.error(`${res.errors.length} assignments failed due to conflicts. See console for details.`);
          console.error("Shift Assignment Conflicts:", res.errors);
        }
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["hr-roster"] });
      } else {
        toast.error("Failed to assign any shifts. Check for overlapping conflicts.");
        console.error("Shift Assignment Errors:", res.errors);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An unexpected error occurred while assigning shifts.");
    }
  });

  const handleSubmit = () => {
    if (!shiftType || !startDate || !endDate || selectedEmployees.size === 0) {
      toast.error("Please fill all required fields and select at least one employee.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start Date cannot be after End Date.");
      return;
    }
    assignMutation.mutate();
  };

  const isAllSelected = employees && employees.length > 0 && selectedEmployees.size === employees.length;
  const isIndeterminate = selectedEmployees.size > 0 && employees && selectedEmployees.size < employees.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">Assign Bulk Shift</DialogTitle>
              <DialogDescription>
                Assign shifts to multiple employees across a specific date range.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Shift Type <span className="text-destructive">*</span></Label>
              <Select value={shiftType} onValueChange={setShiftType}>
                <SelectTrigger className="bg-background/50 border-border/50 focus:ring-blue-500/30">
                  <SelectValue placeholder="Select a shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts?.map(s => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name} ({s.start_time} - {s.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by Department</Label>
              <Input 
                placeholder="E.g. Engineering"
                className="bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date <span className="text-destructive">*</span></Label>
              <Input 
                type="date"
                className="bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date <span className="text-destructive">*</span></Label>
              <Input 
                type="date"
                className="bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Employees ({selectedEmployees.size} selected) <span className="text-destructive">*</span></Label>
              {employees && employees.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className={isIndeterminate && !isAllSelected ? "data-[state=unchecked]:bg-blue-600 data-[state=unchecked]:text-white" : ""}
                  />
                  <Label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">Select All</Label>
                </div>
              )}
            </div>
            <div className="border border-border/50 rounded-xl overflow-hidden bg-background/30 h-[200px] overflow-y-auto p-2">
              {!employees ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading employees...</div>
              ) : employees.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No employees found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.map(emp => (
                    <div key={emp.name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={`emp-${emp.name}`}
                        checked={selectedEmployees.has(emp.name)}
                        onCheckedChange={(c) => handleSelect(emp.name, !!c)}
                      />
                      <Label htmlFor={`emp-${emp.name}`} className="flex flex-col cursor-pointer flex-1">
                        <span className="font-medium text-sm">{emp.employee_name}</span>
                        <span className="text-xs text-muted-foreground">{emp.name} &bull; {emp.department || 'No Dept'}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-xs">
                Assignments overlapping with an existing shift will automatically be skipped to prevent scheduling conflicts.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            disabled={assignMutation.isPending || selectedEmployees.size === 0}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign Roster"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
