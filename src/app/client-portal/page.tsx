"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/lazy-data-table";
import { useQuery } from "@tanstack/react-query";
import { getClientPortalData } from "@/lib/api/client-portal";
import type { ComplianceTracker, ClientDocument } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Download, FileText, CheckCircle2, AlertCircle,
  Clock, ShieldCheck
} from "lucide-react";

export default function ClientPortalDashboard() {
  const [phone, setPhone] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhone(sessionStorage.getItem("client_phone"));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["client_portal", phone],
    queryFn: () => getClientPortalData(phone || ""),
    enabled: !!phone,
  });

  const pendingCount = data?.records?.filter((r: any) => r.status !== "Completed").length || 0;
  const completedCount = data?.records?.filter((r: any) => r.status === "Completed").length || 0;

  const complianceColumns: ColumnDef<ComplianceTracker>[] = [
    {
      accessorKey: "compliance",
      header: "Compliance Module",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">{row.getValue("compliance")}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.original.frequency}</span>
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.getValue("due_date")}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === "Pending" || status === "Overdue") {
          return (
            <Button size="sm" className="h-8 bg-primary hover:bg-primary/50 text-white rounded-lg px-4">
              <Upload className="mr-2 h-3 w-3" />
              Upload Proof
            </Button>
          );
        }
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />;
      },
    },
  ];

  const documentColumns: ColumnDef<ClientDocument>[] = [
    {
      accessorKey: "document_type",
      header: "Document",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{row.getValue("document_type")}</span>
            <span className="text-[10px] text-muted-foreground">{row.original.creation}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1">{row.getValue("description")}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-primary hover:text-primary-foreground">
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) return null; // Handled by layout

  return (
    <div className="p-8 fluid-container w-full space-y-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-[#1e1b4b] p-10 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-pulse" />
            Live Compliance Status
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
              Your practice compliance, <br />
              <span className="text-primary/80">fully managed.</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Welcome back, {data?.customer?.name}. You have {pendingCount} actions requiring your immediate attention.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 pr-10">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{pendingCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 pr-10">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{completedCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left Column: Tables */}
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary/50" />
                Recent Compliance Trackers
              </h2>
            </div>
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-2">
              <DataTable
                columns={complianceColumns}
                data={data?.records || []}
                pageSize={5}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Shared Documents
              </h2>
            </div>
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-2">
              <DataTable
                columns={documentColumns}
                data={data?.documents || []}
                pageSize={5}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Cards & Info */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Environment</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Your data is protected with enterprise-grade encryption. All documents are scanned for security.
            </p>
            <Button className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-xl h-12">
              Security Audit Report
            </Button>
          </div>

          <div className="bg-card border rounded-3xl p-8 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary/50 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">GST Return Filed</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-tighter">May 10, 2024 • 2:30 PM</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
