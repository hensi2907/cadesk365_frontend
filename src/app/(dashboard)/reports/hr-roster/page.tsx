"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Clock, Building, GripVertical } from "lucide-react";
import { getHRRosterData, getShiftTypes, assignBulkRoster, updateShiftAssignment, deleteShiftAssignment, HRRosterRecord } from "@/lib/api/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignShiftModal } from "./components/AssignShiftModal";
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  pointerWithin
} from "@dnd-kit/core";

// Helper to get all days in a month
const getMonthDays = (date: Date) => {
  const daysInMonth = getDaysInMonth(date);
  const start = startOfMonth(date);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const getShiftColor = (shiftType: string) => {
  if (!shiftType) return 'bg-slate-50 text-slate-600 border-slate-200';
  const lower = shiftType.toLowerCase();
  if (lower.includes('morning') || lower.includes('day')) return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  if (lower.includes('night')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  if (lower.includes('evening')) return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
  return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "--";
  const parts = timeStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

// -- DND Components --

function DraggablePaletteShift({ shift }: { shift: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette|${shift.name}`,
    data: { type: 'palette', shiftType: shift.name, shift }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 px-3 rounded-lg border cursor-grab hover:scale-105 transition-transform ${getShiftColor(shift.name)} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <GripVertical className="w-3 h-3 opacity-50" />
      <div className="flex flex-col">
        <span className="font-semibold text-xs leading-tight">{shift.name}</span>
        <span className="text-[10px] opacity-80">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
      </div>
    </div>
  );
}

function DraggableShiftBadge({ shift, assignmentId, originDate }: { shift: HRRosterRecord, assignmentId: string, originDate: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `existing|${assignmentId}|${originDate}`,
    data: { type: 'existing', shift, originDate }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col justify-center w-full h-full p-2 rounded-lg border ${getShiftColor(shift.shift_type)} cursor-grab ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'} transition-transform shadow-sm`}
    >
      <span className="font-semibold text-xs truncate leading-tight mb-1" title={shift.shift_type}>
        {shift.shift_type}
      </span>
      <div className="flex items-center gap-1 text-[10px] opacity-80">
        <Clock className="w-3 h-3" />
        <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
      </div>
    </div>
  );
}

type SpecialStatus = { type: 'weekly_off' | 'holiday' | 'leave', label: string } | null;

function DroppableCell({ employeeId, dateStr, isWeekend, specialStatus, children }: { employeeId: string, dateStr: string, isWeekend: boolean, specialStatus?: SpecialStatus, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${employeeId}|${dateStr}`,
  });

  let bgClass = 'bg-transparent';
  let textClass = '';
  
  if (isOver) {
    bgClass = 'bg-teal-500/10';
  } else if (specialStatus) {
    if (specialStatus.type === 'weekly_off') {
      bgClass = 'bg-slate-50 dark:bg-slate-900/40';
      textClass = 'text-slate-400 dark:text-slate-500 font-semibold tracking-widest';
    } else if (specialStatus.type === 'leave') {
      bgClass = 'bg-rose-50/50 dark:bg-rose-900/10';
      textClass = 'text-rose-400/80 dark:text-rose-500/70 font-medium tracking-wide';
    } else if (specialStatus.type === 'holiday') {
      bgClass = 'bg-amber-50/50 dark:bg-amber-900/10';
      textClass = 'text-amber-500/80 dark:text-amber-600/70 font-medium tracking-wide';
    }
  } else if (!children && isWeekend) {
    bgClass = 'bg-muted/10';
  }

  return (
    <td
      ref={setNodeRef}
      className={`border-b border-r border-border/50 align-top h-[80px] min-w-[140px] relative transition-colors ${bgClass}`}
    >
      {specialStatus ? (
         <div className={`w-full h-full min-h-[80px] flex items-center justify-center text-[11px] uppercase ${textClass}`}>
             {specialStatus.label}
         </div>
      ) : (
         <div className="p-2 h-full w-full">
            {children ? children : (
              <div className={`min-h-[64px] h-full w-full rounded-md border border-dashed transition-colors flex items-center justify-center ${isOver ? 'border-teal-500/50' : 'border-transparent hover:border-border/60 hover:bg-muted/30 group/cell'}`}>
                {!isOver && <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />}
              </div>
            )}
         </div>
      )}
    </td>
  );
}

export default function HRRosterPage() {
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [department, setDepartment] = useState("");
  const [shiftTypeFilter, setShiftTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);

  const monthStart = startOfMonth(currentDate).toISOString().split('T')[0];
  const monthEnd = endOfMonth(currentDate).toISOString().split('T')[0];
  const daysInView = useMemo(() => getMonthDays(currentDate), [currentDate]);

  // Data Fetching
  const { data: rosterData, isLoading, refetch } = useQuery({
    queryKey: ["hr-roster", monthStart, monthEnd, department],
    queryFn: () => getHRRosterData(monthStart, monthEnd, department || undefined),
    enabled: !!monthStart && !!monthEnd,
  });

  const { data: shiftTypes } = useQuery({
    queryKey: ["shift-types"],
    queryFn: getShiftTypes,
  });

  const assignMutation = useMutation({
    mutationFn: (args: { empId: string, shiftType: string, date: string }) =>
      assignBulkRoster([args.empId], args.shiftType, args.date, args.date),
    onSuccess: () => {
      toast.success("Shift assigned successfully.");
      queryClient.invalidateQueries({ queryKey: ["hr-roster"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign shift.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (args: { assignId: string, empId: string, date: string, originDate: string }) =>
      updateShiftAssignment(args.assignId, args.empId, args.date, args.originDate),
    onSuccess: () => {
      toast.success("Shift reassigned successfully.");
      queryClient.invalidateQueries({ queryKey: ["hr-roster"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to move shift.");
    }
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Transform Data into Matrix
  const rosterMatrix = useMemo(() => {
    if (!rosterData) return [];

    // Group by employee
    const employeeMap = new Map<string, {
      id: string;
      name: string;
      department: string;
      shifts: Map<string, HRRosterRecord[]>; // key: YYYY-MM-DD
    }>();

    rosterData.forEach(record => {
      if (!employeeMap.has(record.employee)) {
        employeeMap.set(record.employee, {
          id: record.employee,
          name: record.employee_name,
          department: record.department,
          shifts: new Map(),
        });
      }

      const emp = employeeMap.get(record.employee)!;
      // If it's a valid assignment, map it to days
      if (record.name && record.start_date && record.end_date) {
        daysInView.forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const checkDay = new Date(dayStr).getTime();
          const checkStart = new Date(record.start_date).getTime();
          const checkEnd = new Date(record.end_date).getTime();

          if (checkDay >= checkStart && checkDay <= checkEnd) {
            if (!emp.shifts.has(dayStr)) {
              emp.shifts.set(dayStr, []);
            }
            emp.shifts.get(dayStr)!.push(record);
          }
        });
      }
    });

    let result = Array.from(employeeMap.values());
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(lowerQ) ||
        emp.id.toLowerCase().includes(lowerQ)
      );
    }

    if (shiftTypeFilter) {
      result = result.filter(emp => {
        let hasShift = false;
        emp.shifts.forEach(records => {
          records.forEach(shift => {
            if (shift.shift_type === shiftTypeFilter) hasShift = true;
          });
        });
        return hasShift;
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [rosterData, daysInView, searchQuery, shiftTypeFilter]);

  // -- DND Handlers --
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setActiveDragData(null);
    const { active, over } = event;

    if (!over) return; // Dropped outside valid area

    const overId = over.id as string; // Format: "emp_id|dateStr"
    const [targetEmpId, targetDateStr] = overId.split("|");

    const activeData = active.data.current;
    if (!activeData || !targetEmpId || !targetDateStr) return;

    if (activeData.type === 'palette') {
      // Create new shift from palette
      assignMutation.mutate({
        empId: targetEmpId,
        shiftType: activeData.shiftType,
        date: targetDateStr
      });
    } else if (activeData.type === 'existing') {
      // Move existing shift
      const assignId = active.id.toString().split("|")[1];

      // Don't update if dropped on exact same cell
      const shift = activeData.shift as HRRosterRecord;
      if (shift.employee === targetEmpId && activeData.originDate === targetDateStr) {
        return;
      }

      updateMutation.mutate({
        assignId,
        empId: targetEmpId,
        date: targetDateStr,
        originDate: activeData.originDate
      });
    }
  };

  const uniqueShifts = useMemo(() => {
    if (!shiftTypes) return [];
    return shiftTypes.map(s => s.name);
  }, [shiftTypes]);

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex-1 space-y-6 p-8 pt-6">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="p-2 bg-teal-500/10 dark:bg-teal-500/20 rounded-lg">
            <CalendarDays className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
            Roster: Month View
          </h2>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

          <div className="flex items-center bg-card/60 backdrop-blur-xl border border-border/50 rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 px-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="w-[140px] text-center font-medium text-sm">
              {format(currentDate, "MMMM, yyyy")}
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1 lg:justify-start">
            <div className="w-[180px]">
              <Input
                placeholder="Department"
                className="h-9 bg-card/60 backdrop-blur-xl border-border/50 focus-visible:ring-teal-500/30 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
                <SelectTrigger className="h-9 bg-card/60 backdrop-blur-xl border-border/50 text-sm">
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Shifts</SelectItem>
                  {uniqueShifts.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 bg-card/60 backdrop-blur-xl border-border/50 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-9 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Assign Multiple
            </Button>
          </div>
        </div>

        {/* Draggable Shift Palette */}
        {shiftTypes && shiftTypes.length > 0 && (
          <div className="flex flex-col gap-2 bg-card/30 backdrop-blur-sm border border-border/50 p-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shift Palette (Drag to assign)</span>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
              {shiftTypes.map(shift => (
                <DraggablePaletteShift key={shift.name} shift={shift} />
              ))}
            </div>
          </div>
        )}

        {/* Roster Grid Container */}
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col relative h-[calc(100vh-360px)] min-h-[500px]">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm border-collapse min-w-max">
              <thead className="bg-muted/40 sticky top-0 z-20 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-muted border-b border-r border-border/50 p-2 min-w-[280px] w-[280px]">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search Employee"
                        className="pl-8 bg-background/80 border-border/50 h-9 w-full shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </th>

                  {daysInView.map((day, i) => (
                    <th key={i} className="border-b border-r border-border/50 p-3 min-w-[140px] font-medium text-muted-foreground text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-wider">{format(day, "E")}</span>
                        <span className="text-base text-foreground font-semibold">{format(day, "dd")}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-background">
                {isLoading && rosterMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={daysInView.length + 1} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-teal-500/10 rounded-full">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                        </div>
                        <span className="font-medium text-muted-foreground">Loading roster data...</span>
                      </div>
                    </td>
                  </tr>
                ) : rosterMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={daysInView.length + 1} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <CalendarDays className="w-8 h-8 opacity-20" />
                        <p>No active employees found matching the filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rosterMatrix.map((emp) => (
                    <tr key={emp.id} className="group hover:bg-muted/10 transition-colors">
                      <td className="sticky left-0 z-10 bg-background group-hover:bg-muted/20 border-b border-r border-border/50 p-3 align-top transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-foreground truncate" title={emp.name}>{emp.name}</span>
                            <span className="text-xs text-muted-foreground truncate" title={emp.id}>{emp.id}</span>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Building className="w-3 h-3" />
                              <span className="truncate">{emp.department || "No Dept"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {daysInView.map((day, i) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const records = emp.shifts.get(dayStr) || [];
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        let specialStatus: SpecialStatus = null;
                        let shiftRecord = null;

                        if (records.length > 0) {
                            const leave = records.find(r => r.is_leave);
                            const holiday = records.find(r => r.is_holiday && !r.weekly_off);
                            const wo = records.find(r => r.weekly_off);
                            shiftRecord = records.find(r => !r.is_leave && !r.is_holiday && !r.weekly_off);

                            if (leave) specialStatus = { type: 'leave', label: leave.shift_type };
                            else if (holiday) specialStatus = { type: 'holiday', label: "Holiday" };
                            else if (wo) specialStatus = { type: 'weekly_off', label: "WO" };
                        }

                        return (
                          <DroppableCell
                            key={`${emp.id}-${dayStr}`}
                            employeeId={emp.id}
                            dateStr={dayStr}
                            isWeekend={isWeekend}
                            specialStatus={specialStatus}
                          >
                            {!specialStatus && shiftRecord ? (
                              <div className="h-[52px]">
                                <DraggableShiftBadge shift={shiftRecord} assignmentId={shiftRecord.name} originDate={dayStr} />
                              </div>
                            ) : null}
                          </DroppableCell>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AssignShiftModal open={isModalOpen} onOpenChange={setIsModalOpen} />

        <DragOverlay>
          {activeDragId && activeDragData?.type === 'palette' ? (
            <div className={`flex items-center gap-2 p-2 px-3 rounded-lg border shadow-xl opacity-90 scale-105 ${getShiftColor(activeDragData.shiftType)}`}>
              <div className="flex flex-col">
                <span className="font-semibold text-xs leading-tight">{activeDragData.shiftType}</span>
                <span className="text-[10px] opacity-80">{formatTime(activeDragData.shift.start_time)} - {formatTime(activeDragData.shift.end_time)}</span>
              </div>
            </div>
          ) : activeDragId && activeDragData?.type === 'existing' ? (
            <div className={`flex flex-col justify-center w-[140px] h-[80px] p-2 rounded-lg border shadow-xl opacity-90 scale-105 ${getShiftColor(activeDragData.shift.shift_type)}`}>
              <span className="font-semibold text-xs truncate leading-tight mb-1">{activeDragData.shift.shift_type}</span>
              <div className="flex items-center gap-1 text-[10px] opacity-80">
                <Clock className="w-3 h-3" />
                <span>{formatTime(activeDragData.shift.start_time)} - {formatTime(activeDragData.shift.end_time)}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.5);
          }
        `}} />
      </div>
    </DndContext>
  );
}
