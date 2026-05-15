"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientPortalData } from "@/lib/api/client-portal";
import { DataTable } from "@/components/shared/lazy-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Download, ExternalLink, Calendar, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { motion } from "framer-motion";

export default function ClientInvoices() {
  const [phone, setPhone] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhone(sessionStorage.getItem("client_phone"));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["client_portal", phone],
    queryFn: () => getClientPortalData(phone || ""),
    enabled: !!phone,
  });

  // Mocking invoices as they might not be in the primary API yet
  const mockInvoices = [
    { name: "INV-2024-001", posting_date: "2024-05-01", grand_total: 15000, status: "Paid", due_date: "2024-05-15" },
    { name: "INV-2024-002", posting_date: "2024-05-10", grand_total: 8500, status: "Unpaid", due_date: "2024-05-24" },
    { name: "INV-2024-003", posting_date: "2024-04-20", grand_total: 12000, status: "Overdue", due_date: "2024-05-04" },
  ];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <span className="font-bold">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "posting_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">{row.getValue("posting_date")}</span>
        </div>
      ),
    },
    {
      accessorKey: "grand_total",
      header: "Amount",
      cell: ({ row }) => <span className="font-bold text-sm">₹{row.getValue<number>("grand_total").toLocaleString()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-9 rounded-lg px-3 text-primary hover:text-primary/90 hover:bg-primary/5">
            <ExternalLink className="mr-2 h-4 w-4" /> Pay Now
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 fluid-container space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">View your history, track payments, and download invoices.</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 px-6 h-12">
          <Wallet className="mr-2 h-4 w-4" /> Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none bg-gradient-to-br from-primary to-emerald-500 text-white shadow-xl">
          <CardContent className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <CheckCircle2 className="h-8 w-8 opacity-50" />
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">Total Paid</span>
            </div>
            <p className="text-4xl font-black">₹45,000</p>
            <p className="mt-2 text-xs font-medium opacity-70">CURRENT FINANCIAL YEAR</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none bg-white dark:bg-[#121214] shadow-sm">
          <CardContent className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <AlertCircle className="h-8 w-8 text-amber-500 opacity-50" />
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Outstanding</span>
            </div>
            <p className="text-4xl font-black">₹8,500</p>
            <p className="mt-2 text-xs font-bold text-amber-500">DUE IN 12 DAYS</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none bg-white dark:bg-[#121214] shadow-sm">
          <CardContent className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <CreditCard className="h-8 w-8 text-violet-500 opacity-50" />
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Next Invoice</span>
            </div>
            <p className="text-4xl font-black italic opacity-40">Pending</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">SCHEDULED FOR JUNE 1</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-2">
        <DataTable
          columns={columns}
          data={mockInvoices}
          pageSize={10}
        />
      </div>
    </div>
  );
}
