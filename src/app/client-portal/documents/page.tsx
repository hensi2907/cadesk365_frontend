"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientPortalData } from "@/lib/api/client-portal";
import { DataTable } from "@/components/shared/lazy-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ClientDocument } from "@/types/api";
import { FileText, Download, Upload, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClientDocuments() {
  const [phone, setPhone] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhone(sessionStorage.getItem("client_phone"));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["client_portal", phone],
    queryFn: () => getClientPortalData(phone || ""),
    enabled: !!phone,
  });

  const columns: ColumnDef<ClientDocument>[] = [
    {
      accessorKey: "document_type",
      header: "Document Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.getValue("document_type")}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.original.creation}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("description") || "No description provided"}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <div className="flex justify-end">
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
          <h1 className="text-3xl font-black tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Access your shared files and upload new documents securely.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-dashed">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/50 text-white rounded-xl font-bold shadow-lg shadow-primary/20 px-6">
            <Plus className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">1.2 GB</p>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[15%] bg-primary/50" />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground font-bold">15% OF 10GB USED</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">12</p>
            <p className="mt-2 text-[10px] text-emerald-500 font-bold tracking-widest">↑ 3 THIS WEEK</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">2</p>
            <p className="mt-2 text-[10px] text-amber-500 font-bold tracking-widest">AWAITING VERIFICATION</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-2">
        <div className="p-4 flex items-center justify-between border-b border-border/50 mb-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full h-9 bg-muted/50 border-none rounded-lg pl-9 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={data?.documents || []}
          isLoading={isLoading}
          pageSize={10}
        />
      </div>

      {/* Upload Dropzone Placeholder */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/50/20 flex items-center justify-center text-primary">
          <Upload className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Drag and drop files here</h3>
          <p className="text-sm text-muted-foreground">Or click to browse from your computer (Max 25MB per file)</p>
        </div>
      </motion.div>
    </div>
  );
}
