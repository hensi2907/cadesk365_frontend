"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientPortalData } from "@/lib/api/client-portal";
import { DataTable } from "@/components/shared/lazy-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ComplianceTracker } from "@/types/api";
import { Clock, CheckCircle2, AlertCircle, MessageSquare, ArrowRight, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function ClientCompliances() {
  const [phone, setPhone] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<ComplianceTracker | null>(null);

  React.useEffect(() => {
    setPhone(sessionStorage.getItem("client_phone"));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["client_portal", phone],
    queryFn: () => getClientPortalData(phone || ""),
    enabled: !!phone,
  });

  const columns: ColumnDef<ComplianceTracker>[] = [
    {
      accessorKey: "compliance",
      header: "Service",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">{row.getValue("compliance")}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.original.frequency}</span>
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Deadline",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{row.getValue("due_date")}</span>
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
      cell: ({ row }) => (
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-primary hover:text-primary/90 hover:bg-primary/5"
          onClick={() => setSelectedTask(row.original)}
        >
          View Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8">
      <div className="flex-1 space-y-8 min-w-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Compliance Tracking</h1>
          <p className="text-muted-foreground">Monitor your ongoing regulatory compliances and action items.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-amber-700">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-6 w-6" />
              <span className="text-2xl font-black">
                {data?.records?.filter((r: any) => r.status === "Overdue").length || 0}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Overdue</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 text-blue-700">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-6 w-6" />
              <span className="text-2xl font-black">
                {data?.records?.filter((r: any) => r.status === "Pending").length || 0}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Pending</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-2xl font-black">
                {data?.records?.filter((r: any) => r.status === "Completed").length || 0}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Completed</p>
          </div>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-2">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by compliance name..." className="pl-9 h-10 bg-muted/50 border-none rounded-xl" />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data?.records || []}
            isLoading={isLoading}
            pageSize={15}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-96 bg-card border rounded-[2.5rem] p-8 shadow-2xl sticky top-24 self-start hidden xl:block"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)} className="rounded-full">Close</Button>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{selectedTask.compliance}</h2>
                <StatusBadge status={selectedTask.status} className="mt-2" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-bold">{selectedTask.due_date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-bold uppercase tracking-tighter text-xs">{selectedTask.frequency}</span>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Task Comments
                </h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-widest">Admin • 2h ago</p>
                    <p className="text-sm">Please upload the electricity bill for verification.</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/50/10 rounded-2xl p-4 text-right">
                    <p className="text-xs text-primary font-bold mb-1 uppercase tracking-widest">You • 1h ago</p>
                    <p className="text-sm">I have uploaded the bill. Please check.</p>
                  </div>
                </div>

                <div className="mt-4 relative">
                  <Input placeholder="Type a comment..." className="h-12 rounded-2xl pr-12 bg-muted/30 border-none" />
                  <Button size="sm" className="absolute right-1.5 top-1.5 h-9 w-9 p-0 rounded-xl bg-primary hover:bg-primary/50">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
