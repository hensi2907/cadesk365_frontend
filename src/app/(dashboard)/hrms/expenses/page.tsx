"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getHrmsData } from "@/lib/api/hrms";
import type { ExpenseClaim } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { Receipt, Clock, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

import { getNewRecordRoute } from "@/lib/utils/route";
import { useRouter } from "next/navigation";

export default function ExpensesPage() {
  const router = useRouter();
  const [selectedExpense, setSelectedExpense] = React.useState<ExpenseClaim | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrms_expenses"],
    queryFn: () => getHrmsData("expenses") as any,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const columns: ColumnDef<ExpenseClaim>[] = [
    {
      accessorKey: "name",
      header: "Claim ID",
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "posting_date",
      header: "Date",
    },
    {
      accessorKey: "expense_type",
      header: "Type",
    },
    {
      accessorKey: "total_claimed_amount",
      header: "Claimed Amount",
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("total_claimed_amount"))}</span>,
    },
    {
      accessorKey: "total_sanctioned_amount",
      header: "Sanctioned",
      cell: ({ row }) => {
        const val = row.getValue("total_sanctioned_amount") as number;
        return val > 0 ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(val)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "approval_status",
      header: "Approval",
      cell: ({ row }) => <StatusBadge status={row.getValue("approval_status")} />,
    },
    {
      accessorKey: "status",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === "Paid") return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20">Paid</span>;
        return <span className="text-muted-foreground text-sm">{status}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Claims"
        description="Submit and track your reimbursement requests."
      >
        <Button onClick={() => router.push(getNewRecordRoute("Expense Claim"))} className="!bg-primary/80 hover:!bg-primary/60">
          <Receipt className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Claimed (YTD)"
          value={formatCurrency(data?.total_claimed || 0)}
          icon={Receipt}
          variant="default"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Approval"
          value={data?.pending || 0}
          icon={Clock}
          variant={data?.pending && data.pending > 0 ? "warning" : "default"}
          isLoading={isLoading}
        />
        <StatCard
          title="Approved"
          value={data?.approved || 0}
          icon={CheckCircle2}
          variant="success"
          isLoading={isLoading}
        />
        <StatCard
          title="Advance Balance"
          value={formatCurrency(data?.advance_balance || 0)}
          icon={Receipt}
          variant="info"
          description="Unsettled advance amount"
          isLoading={isLoading}
        />
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium text-foreground">Recent Claims</h3>
        <DataTable
          columns={columns}
          data={data?.records || []}
          onRowClick={setSelectedExpense}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      </div>

      <DetailDrawer
        open={!!selectedExpense}
        onOpenChange={(o) => !o && setSelectedExpense(null)}
        title={`Expense Claim: ${selectedExpense?.name}`}
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="flex gap-4 mb-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Approval</div>
                <StatusBadge status={selectedExpense.approval_status} />
              </div>
              {selectedExpense.status === "Paid" && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Payment</div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg border bg-muted/20">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Date</div>
                <div className="font-medium">{selectedExpense.posting_date}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Expense Type</div>
                <div className="font-medium">{selectedExpense.expense_type}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Claimed Amount</div>
                <div className="font-medium text-lg">{formatCurrency(selectedExpense.total_claimed_amount)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Sanctioned Amount</div>
                <div className={`font-medium text-lg ${selectedExpense.total_sanctioned_amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {selectedExpense.total_sanctioned_amount > 0 ? formatCurrency(selectedExpense.total_sanctioned_amount) : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
