"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, PackageOpen, History, CheckCircle2 } from "lucide-react";
import { ReportTable } from "@/components/reports/ReportTable";
import { getLeaveBalanceReport, getLeaveHistoryReport } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function LeaveReportPage() {
  const [reportType, setReportType] = useState<"balance" | "history">("balance");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["reports", "leave-balance"],
    queryFn: () => getLeaveBalanceReport(),
    enabled: reportType === "balance",
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["reports", "leave-history", fromDate, toDate],
    queryFn: () => getLeaveHistoryReport(fromDate || undefined, toDate || undefined),
    enabled: reportType === "history",
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
      case "Approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{status}</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">{status}</Badge>;
      case "Open":
      case "Pending":
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = useMemo(() => {
    if (reportType === "balance" && balanceData) {
      const totalPending = balanceData.reduce((acc, curr) => acc + curr.pending, 0);
      return [
        { label: "Active Allocations", value: balanceData.length, icon: PackageOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Pending Requests", value: totalPending, icon: History, color: "text-orange-500", bg: "bg-orange-500/10" },
      ];
    } else if (reportType === "history" && historyData) {
      const approved = historyData.filter(h => h.status === "Approved").length;
      return [
        { label: "Total Applications", value: historyData.length, icon: History, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Approved Leaves", value: approved, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
      ];
    }
    return [];
  }, [reportType, balanceData, historyData]);

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
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Leaves & Time-Off
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Review employee leave balances, audit historical time-off applications, and manage organizational availability.
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
            <CardDescription>Select report type and date ranges.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
              <Label className="text-sm font-medium text-muted-foreground">Report Type</Label>
              <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="Select Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Real-Time Balances</SelectItem>
                  <SelectItem value="history">Leave History Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportType === "history" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">From Date</Label>
                  <Input type="date" className="h-10 bg-background" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">To Date</Label>
                  <Input type="date" className="h-10 bg-background" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {reportType === "balance" && (
          <ReportTable
            title="Leave Balances"
            data={balanceData || []}
            isLoading={balanceLoading}
            searchKey="employee_name"
            onExport={() => handleExport(balanceData || [], "leave_balance_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "leave_type", header: "Type" },
              { 
                key: "allocated", 
                header: "Allocated",
                render: (row) => <span className="font-medium">{row.allocated}</span>
              },
              { key: "used", header: "Used" },
              { 
                key: "pending", 
                header: "Pending",
                render: (row) => (
                  <span className={row.pending > 0 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                    {row.pending > 0 ? `+${row.pending}` : "0"}
                  </span>
                )
              },
              { 
                key: "balance", 
                header: "Remaining",
                render: (row) => (
                  <Badge variant="outline" className={
                    row.balance <= 2 ? "border-red-500 text-red-500 bg-red-500/10" : 
                    "border-green-500 text-green-500 bg-green-500/10"
                  }>
                    {row.balance} days
                  </Badge>
                )
              },
            ]}
          />
        )}

        {reportType === "history" && (
          <ReportTable
            title="Leave Applications"
            data={historyData || []}
            isLoading={historyLoading}
            searchKey="employee_name"
            onExport={() => handleExport(historyData || [], "leave_history_report")}
            columns={[
              { key: "employee", header: "ID" },
              { key: "employee_name", header: "Employee" },
              { key: "department", header: "Department" },
              { key: "leave_type", header: "Type" },
              { key: "from_date", header: "Start" },
              { key: "to_date", header: "End" },
              { key: "total_leave_days", header: "Days" },
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
