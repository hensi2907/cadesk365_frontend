"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, UserCheck, UserX, AlertCircle, Calendar } from "lucide-react";
import { ReportTable } from "@/components/reports/ReportTable";
import { getAttendanceReport, getDailyCheckinReport, getLateArrivalReport } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AttendanceReportPage() {
  const [reportType, setReportType] = useState<"attendance" | "checkin" | "late">("attendance");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ["reports", "attendance", fromDate, toDate],
    queryFn: () => getAttendanceReport(fromDate || undefined, toDate || undefined),
    enabled: reportType === "attendance",
  });

  const { data: checkinData, isLoading: chkLoading } = useQuery({
    queryKey: ["reports", "checkin", fromDate, toDate],
    queryFn: () => getDailyCheckinReport(fromDate || undefined, toDate || undefined),
    enabled: reportType === "checkin",
  });

  const { data: lateData, isLoading: lateLoading } = useQuery({
    queryKey: ["reports", "late", fromDate, toDate],
    queryFn: () => getLateArrivalReport(fromDate || undefined, toDate || undefined),
    enabled: reportType === "late",
  });

  const handleExport = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      keys.join(",") +
      "\n" +
      data.map((row) => keys.map((k) => `"${row[k] || ""}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate stats dynamically
  const stats = useMemo(() => {
    if (reportType === "attendance" && attendanceData) {
      const present = attendanceData.filter(d => d.status === "Present" || d.status === "Work From Home" || d.status === "Half Day").length;
      const absent = attendanceData.filter(d => d.status === "Absent").length;
      return [
        { label: "Total Records", value: attendanceData.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Total Present", value: present, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Total Absent", value: absent, icon: UserX, color: "text-red-500", bg: "bg-red-500/10" },
      ];
    } else if (reportType === "late" && lateData) {
      return [
        { label: "Total Late Arrivals", value: lateData.length, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
      ];
    } else if (reportType === "checkin" && checkinData) {
      return [
        { label: "Total Logs", value: checkinData.length, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
      ];
    }
    return [];
  }, [reportType, attendanceData, lateData, checkinData]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Attendance Reports
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Monitor and analyze employee attendance patterns, track daily check-ins, and review late arrival histories across the organization.
        </p>
      </motion.div>

      {/* Stats Cards */}
      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {stats.map((stat, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Report Configuration
            </CardTitle>
            <CardDescription>Adjust the parameters to filter the report data.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
              <Label className="text-sm font-medium text-muted-foreground">Report Type</Label>
              <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="Select Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Employee Attendance</SelectItem>
                  <SelectItem value="checkin">Daily Check-In logs</SelectItem>
                  <SelectItem value="late">Late Arrivals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">From Date</Label>
              <Input type="date" className="h-10 bg-background" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">To Date</Label>
              <Input type="date" className="h-10 bg-background" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {reportType === "attendance" && (
          <ReportTable
            title="Employee Attendance"
            data={attendanceData || []}
            isLoading={attLoading}
            searchKey="employee_name"
            onExport={() => handleExport(attendanceData || [], "attendance_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "department", header: "Department" },
              { key: "attendance_date", header: "Date" },
              {
                key: "status",
                header: "Status",
                render: (row) => getStatusBadge(row.status),
              },
              { key: "working_hours", header: "Hours Logged" },
            ]}
          />
        )}

        {reportType === "checkin" && (
          <ReportTable
            title="Daily Logs"
            data={checkinData || []}
            isLoading={chkLoading}
            searchKey="employee_name"
            onExport={() => handleExport(checkinData || [], "checkin_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "time", header: "Timestamp" },
              {
                key: "log_type",
                header: "Action",
                render: (row) => (
                  <Badge variant={row.log_type === "IN" ? "default" : "secondary"}>
                    {row.log_type}
                  </Badge>
                ),
              },
              { key: "device_id", header: "Device/Source" },
            ]}
          />
        )}

        {reportType === "late" && (
          <ReportTable
            title="Late Arrivals"
            data={lateData || []}
            isLoading={lateLoading}
            searchKey="employee_name"
            onExport={() => handleExport(lateData || [], "late_arrival_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "department", header: "Department" },
              { key: "attendance_date", header: "Date" },
              { key: "working_hours", header: "Hours Logged" },
              {
                key: "status",
                header: "Status",
                render: (row) => getStatusBadge(row.status),
              },
            ]}
          />
        )}
      </motion.div>
    </div>
  );
}
