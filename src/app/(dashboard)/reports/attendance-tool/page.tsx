"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, RefreshCw, CalendarCheck, Search, Building, User } from "lucide-react";
import { getAttendanceToolData, markBulkAttendance, AttendanceToolRecord } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function AttendanceToolPage() {
  const queryClient = useQueryClient();
  
  // Filters
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  // Data Fetching
  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ["attendance-tool", date, department, company],
    queryFn: () => getAttendanceToolData(date, company || undefined, department || undefined),
    enabled: !!date,
  });

  // Derived filtered data (local search)
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchQuery) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(e => 
      e.employee.toLowerCase().includes(lowerQuery) || 
      e.employee_name.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(filteredEmployees.map(e => e.employee)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  // Handle individual selection
  const handleSelect = (employeeId: string, checked: boolean) => {
    const newSet = new Set(selectedEmployees);
    if (checked) {
      newSet.add(employeeId);
    } else {
      newSet.delete(employeeId);
    }
    setSelectedEmployees(newSet);
  };

  // Mutation for saving
  const markMutation = useMutation({
    mutationFn: async ({ employees, status }: { employees: string[], status: string }) => {
      return markBulkAttendance(date, employees, status);
    },
    onSuccess: (res) => {
      toast.success(`Successfully marked attendance for ${res.marked_count} employees.`);
      setSelectedEmployees(new Set()); // clear selection
      queryClient.invalidateQueries({ queryKey: ["attendance-tool"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark attendance.");
    }
  });

  const handleBulkAction = (status: string) => {
    if (selectedEmployees.size === 0) {
      toast.error("No employees selected");
      return;
    }
    markMutation.mutate({
      employees: Array.from(selectedEmployees),
      status
    });
  };

  const handleInlineAction = (employeeId: string, status: string) => {
    markMutation.mutate({
      employees: [employeeId],
      status
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{status}</Badge>;
      case "Absent":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">{status}</Badge>;
      case "Half Day":
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">{status}</Badge>;
      case "Work From Home":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{status}</Badge>;
      case "On Leave":
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-dashed">Not Marked</Badge>;
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return "--";
    const d = new Date(datetime);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAllSelected = filteredEmployees.length > 0 && selectedEmployees.size === filteredEmployees.length;
  const isIndeterminate = selectedEmployees.size > 0 && selectedEmployees.size < filteredEmployees.length;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl shadow-sm border border-teal-500/20">
            <CalendarCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">
            Attendance Tool
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          A centralized utility to bulk mark and manage daily employee attendance records efficiently.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              Configuration & Filters
            </CardTitle>
            <CardDescription>Select the date and filter criteria to load employees.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Attendance Date <span className="text-destructive">*</span></Label>
              <Input 
                type="date" 
                className="h-10 bg-background/50 border-border/50 focus-visible:ring-teal-500/30 w-[200px]" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
              <Input 
                placeholder="E.g. Engineering"
                className="h-10 bg-background/50 border-border/50 focus-visible:ring-teal-500/30 w-[200px]" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Company</Label>
              <Input 
                placeholder="E.g. CADESK365"
                className="h-10 bg-background/50 border-border/50 focus-visible:ring-teal-500/30 w-[200px]" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
              />
            </div>

            <Button onClick={() => refetch()} variant="outline" className="h-10 border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-600 transition-colors">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reload Roster
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8 bg-background/50 border-border/50 focus-visible:ring-teal-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Badge variant="secondary" className="hidden sm:flex text-sm px-3 py-1">
              {filteredEmployees.length} Records
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <span className="text-sm font-medium text-muted-foreground mr-2 whitespace-nowrap">
              {selectedEmployees.size} Selected
            </span>
            <Button 
              size="sm" 
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
              onClick={() => handleBulkAction("Present")}
              disabled={selectedEmployees.size === 0 || markMutation.isPending}
            >
              Mark Present
            </Button>
            <Button 
              size="sm" 
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all"
              onClick={() => handleBulkAction("Absent")}
              disabled={selectedEmployees.size === 0 || markMutation.isPending}
            >
              Mark Absent
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-border/50 hover:bg-accent/50 transition-all"
              onClick={() => handleBulkAction("Half Day")}
              disabled={selectedEmployees.size === 0 || markMutation.isPending}
            >
              Half Day
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-border/50 hover:bg-accent/50 transition-all"
              onClick={() => handleBulkAction("Work From Home")}
              disabled={selectedEmployees.size === 0 || markMutation.isPending}
            >
              WFH
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30 backdrop-blur-md sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox 
                      checked={isAllSelected} 
                      onCheckedChange={handleSelectAll}
                      className={isIndeterminate && !isAllSelected ? "data-[state=unchecked]:bg-primary data-[state=unchecked]:text-primary-foreground" : ""}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Inline Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-teal-500/10 rounded-full">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                        </div>
                        <span className="font-medium">Fetching roster data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <User className="w-8 h-8 opacity-20" />
                        <p>No employees found matching the current filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow 
                      key={emp.employee} 
                      className={`transition-all duration-200 group ${selectedEmployees.has(emp.employee) ? 'bg-teal-500/5 dark:bg-teal-500/10 border-l-2 border-teal-500' : 'hover:bg-muted/40 border-l-2 border-transparent'}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={selectedEmployees.has(emp.employee)}
                          onCheckedChange={(c) => handleSelect(emp.employee, !!c)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{emp.employee_name}</span>
                          <span className="text-xs text-muted-foreground">{emp.employee}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{emp.department || '--'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(emp.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{formatTime(emp.check_in)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground">{formatTime(emp.check_out)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{emp.working_hours ? emp.working_hours.toFixed(2) : '--'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.status === "Not Marked" ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 rounded-full" onClick={() => handleInlineAction(emp.employee, "Present")}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full" onClick={() => handleInlineAction(emp.employee, "Absent")}>
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Select 
                            value={emp.status} 
                            onValueChange={(val) => handleInlineAction(emp.employee, val)}
                          >
                            <SelectTrigger className="h-8 w-[120px] text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Present">Present</SelectItem>
                              <SelectItem value="Absent">Absent</SelectItem>
                              <SelectItem value="Half Day">Half Day</SelectItem>
                              <SelectItem value="Work From Home">WFH</SelectItem>
                              <SelectItem value="On Leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
