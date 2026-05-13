"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, TrendingUp, AlertTriangle, Target, Activity } from "lucide-react";
import { ReportTable } from "@/components/reports/ReportTable";
import { getWorkHoursSummary, getOvertimeReport } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function WorkHoursReportPage() {
  const [reportType, setReportType] = useState<"summary" | "overtime">("summary");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports", "work-hours", fromDate, toDate],
    queryFn: () => getWorkHoursSummary(fromDate || undefined, toDate || undefined),
    enabled: reportType === "summary",
  });

  const { data: overtimeData, isLoading: overtimeLoading } = useQuery({
    queryKey: ["reports", "overtime", fromDate, toDate],
    queryFn: () => getOvertimeReport(fromDate || undefined, toDate || undefined),
    enabled: reportType === "overtime",
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

  const stats = useMemo(() => {
    if (reportType === "summary" && summaryData) {
      const avgProd = summaryData.reduce((acc, curr) => acc + curr.productivity, 0) / (summaryData.length || 1);
      return [
        { label: "Total Employees", value: summaryData.length, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Avg Productivity", value: `${avgProd.toFixed(1)}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
      ];
    } else if (reportType === "overtime" && overtimeData) {
      const totalOvertime = overtimeData.reduce((acc, curr) => acc + curr.overtime_hours, 0);
      return [
        { label: "Overtime Incidents", value: overtimeData.length, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Total OT Hours", value: totalOvertime.toFixed(1), icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
      ];
    }
    return [];
  }, [reportType, summaryData, overtimeData]);

  // Chart data formatting
  const chartData = useMemo(() => {
    if (reportType === "summary" && summaryData) {
      // Top 10 by total hours
      return [...summaryData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10);
    }
    return [];
  }, [reportType, summaryData]);

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
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Work Hours & Productivity
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Analyze employee efficiency, track overtime hours, and ensure fair workload distribution across the teams.
        </p>
      </motion.div>

      {/* Stats Cards */}
      {stats.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2"
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

      {/* Optional Chart for Summary */}
      {reportType === "summary" && chartData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle>Top 10 Employees (Actual vs Expected Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="employee_name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="total_hours" name="Actual Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expected_hours" name="Expected Hours" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
            <CardDescription>Adjust date ranges and report scope.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
              <Label className="text-sm font-medium text-muted-foreground">Report Type</Label>
              <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="Select Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Work Hours Summary</SelectItem>
                  <SelectItem value="overtime">Overtime Incidents</SelectItem>
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
        {reportType === "summary" && (
          <ReportTable
            title="Summary Data"
            data={summaryData || []}
            isLoading={summaryLoading}
            searchKey="employee_name"
            onExport={() => handleExport(summaryData || [], "work_hours_summary")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "department", header: "Department" },
              { key: "days_present", header: "Days Present" },
              { key: "expected_hours", header: "Target (Hrs)" },
              { key: "total_hours", header: "Actual (Hrs)" },
              {
                key: "productivity",
                header: "Productivity",
                render: (row) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.productivity >= 100 ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" : 
                    row.productivity < 80 ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400" : 
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
                  }`}>
                    {row.productivity.toFixed(1)}%
                  </span>
                ),
              },
            ]}
          />
        )}

        {reportType === "overtime" && (
          <ReportTable
            title="Overtime Data"
            data={overtimeData || []}
            isLoading={overtimeLoading}
            searchKey="employee_name"
            onExport={() => handleExport(overtimeData || [], "overtime_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "department", header: "Department" },
              { key: "attendance_date", header: "Date" },
              { key: "standard_hours", header: "Standard Shift" },
              { key: "working_hours", header: "Total Logged" },
              {
                key: "overtime_hours",
                header: "Overtime Logged",
                render: (row) => (
                  <span className="text-orange-500 font-semibold bg-orange-500/10 px-2 py-1 rounded-md">
                    +{row.overtime_hours.toFixed(1)} hrs
                  </span>
                ),
              },
            ]}
          />
        )}
      </motion.div>
    </div>
  );
}
