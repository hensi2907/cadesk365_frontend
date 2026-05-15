"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDoctypeList } from "@/lib/api/doctype";
import { getAllUserPermissions } from "@/lib/api/permissions";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { getRecordRoute } from "@/lib/utils/route";

interface ComplianceRecord {
  name: string;
  item_code: string;
  item_name: string;
  country_of_origin: string;
  custom_service_category: string;
  custom_governing_authority: string;
  standard_rate: number;
  custom_applies_to_all_business_entities: number;
}

export default function ComplianceListPage() {
  const router = useRouter();

  const { data: permissions } = useQuery({
    queryKey: ["permissions", "Item"],
    queryFn: () => getAllUserPermissions("Item"),
  });

  const { data: records, isLoading, isError, refetch } = useQuery({
    queryKey: ["compliance-list"],
    queryFn: () => getDoctypeList<ComplianceRecord>(
      "Item",
      [
        "name", "item_code", "item_name", "country_of_origin", 
        "custom_service_category", "custom_governing_authority", 
        "standard_rate", "custom_applies_to_all_business_entities"
      ],
      [["item_group", "=", "CA Service"]],
      0,
      1000
    ),
  });


  const columns: ColumnDef<ComplianceRecord>[] = [
    {
      accessorKey: "item_name",
      header: "Compliance Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.getValue("item_name")}</div>
          <div className="text-xs text-muted-foreground">{row.original.item_code}</div>
        </div>
      ),
    },
    {
      accessorKey: "country_of_origin",
      header: "Country",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("country_of_origin") || "—"}</span>,
    },
    {
      accessorKey: "custom_service_category",
      header: "Category",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("custom_service_category") || "—"}</span>,
    },
    {
      accessorKey: "custom_governing_authority",
      header: "Governing Authority",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("custom_governing_authority") || "—"}</span>,
    },
    {
      accessorKey: "standard_rate",
      header: "Rate",
      cell: ({ row }) => <span className="font-medium">{row.getValue("standard_rate") || 0}</span>,
    },
    {
      accessorKey: "custom_applies_to_all_business_entities",
      header: "Applies to All",
      cell: ({ row }) => (
        <Checkbox 
          checked={row.getValue("custom_applies_to_all_business_entities") === 1} 
          disabled 
          className="opacity-100"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 fluid-container pb-16">
      <PageHeader title="Compliance Records" description="Manage and view compliance setup for services.">
        <div className="flex items-center gap-2">
          {permissions?.export && (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
          {permissions?.create && (
            <Button onClick={() => router.push("/compliance/new")} size="sm" className="gap-1.5 !bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              Create Compliance
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="rounded-xl border bg-card shadow-sm p-4">
        <DataTable 
          columns={columns} 
          data={records || []} 
          searchKey="item_name" 
          onRowClick={(row: ComplianceRecord) => router.push(`/compliance/${encodeURIComponent(row.name)}`)} 
          isLoading={isLoading} 
          isError={isError} 
          onRetry={refetch} 
          pageSize={20} 
          pageSizeOptions={[10, 20, 50]} 
        />
      </div>
    </div>
  );
}
