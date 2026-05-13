"use client";

import * as React from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPayrollSummary, getEmployeePayrollDetails } from "@/lib/api/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/lazy-chart-card";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { 
  Search, Info, IndianRupee, Users, Wallet, FileText, Download, 
  TrendingUp, TrendingDown, Clock, Building, ArrowUpRight
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const VarianceIndicator = ({ value, label, inverse = false }: { value?: number, label: string, inverse?: boolean }) => {
  if (value === undefined || value === 0) return <span>{label}</span>;
  const isUp = value > 0;
  const isGood = inverse ? !isUp : isUp;
  return (
    <span className="flex items-center gap-1.5 mt-1">
      {isUp ? <TrendingUp className={cn("h-3.5 w-3.5", isGood ? "text-emerald-500" : "text-rose-500")} /> : 
              <TrendingDown className={cn("h-3.5 w-3.5", isGood ? "text-emerald-500" : "text-rose-500")} />}
      <span className={cn("font-medium", isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
        {Math.abs(value).toFixed(1)}% vs prev
      </span>
      <span className="text-muted-foreground ml-1">· {label}</span>
    </span>
  );
};

function PayrollSummaryContent() {
  const [employee, setEmployee] = React.useState("");
  const [department, setDepartment] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [selectedSlip, setSelectedSlip] = React.useState<string | null>(null);
  
  const [activeFilters, setActiveFilters] = React.useState({
    employee: "",
    department: "",
    status: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payroll-summary", activeFilters],
    queryFn: () => getPayrollSummary({
      employee: activeFilters.employee || undefined,
      department: activeFilters.department === "all" ? undefined : activeFilters.department,
      status: activeFilters.status === "all" ? undefined : activeFilters.status,
    }),
  });

  const { data: slipDetails, isLoading: isLoadingSlip } = useQuery({
    queryKey: ["payroll-details", selectedSlip],
    queryFn: () => selectedSlip ? getEmployeePayrollDetails(selectedSlip) : null,
    enabled: !!selectedSlip,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ employee, department, status });
  };

  const handleReset = () => {
    setEmployee("");
    setDepartment("all");
    setStatus("all");
    setActiveFilters({ employee: "", department: "", status: "" });
  };

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { 
      accessorKey: "employee_name", 
      header: "Employee",
      cell: ({ row }) => (
        <div 
          className="cursor-pointer group flex items-center gap-2"
          onClick={() => setSelectedSlip(row.original.name)}
        >
          <div>
            <div className="font-medium group-hover:text-primary transition-colors">{row.getValue("employee_name")}</div>
            <div className="text-xs text-muted-foreground">{row.original.employee}</div>
          </div>
        </div>
      )
    },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "designation", header: "Designation" },
    { 
      accessorKey: "gross_pay", 
      header: "Gross Salary",
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("gross_pay"))}</span>
    },
    { 
      accessorKey: "total_deduction", 
      header: "Deductions",
      cell: ({ row }) => <span className="text-rose-500">{formatCurrency(row.getValue("total_deduction"))}</span>
    },
    { 
      accessorKey: "net_pay", 
      header: "Net Salary",
      cell: ({ row }) => <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(row.getValue("net_pay"))}</span>
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const docstatus = row.original.docstatus;
        return (
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium",
            docstatus === 1 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
            docstatus === 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" :
            "bg-muted text-muted-foreground border border-border"
          )}>
            {docstatus === 1 ? "Paid" : docstatus === 0 ? "Pending" : "Cancelled"}
          </span>
        );
      }
    },
  ], []);

  const departmentColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <PageHeader 
          title="Payroll Analytics" 
          description="Enterprise payroll insights and processing dashboard." 
          className="mb-0 shrink-0" 
        />
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <Input 
            placeholder="Employee Name/ID..." 
            value={employee} 
            onChange={(e) => setEmployee(e.target.value)} 
            className="w-[180px] h-9" 
          />
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Submitted">Paid</SelectItem>
              <SelectItem value="Draft">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="default" size="sm" className="h-9">
            <Search className="h-3.5 w-3.5 mr-1.5" /> Analyze
          </Button>
          {(activeFilters.employee || activeFilters.department || activeFilters.status) && (
            <Button type="button" variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={handleReset}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[104px] bg-muted rounded-xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="h-[340px] bg-muted rounded-xl lg:col-span-1" />
            <div className="h-[340px] bg-muted rounded-xl lg:col-span-2" />
          </div>
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      ) : isError || !data ? (
        <div className="p-12 text-center border rounded-xl bg-card">
          <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-base font-medium">Unable to load data</h3>
          <p className="text-sm text-muted-foreground mt-1">Please try adjusting your filters or try again later.</p>
        </div>
      ) : (
        <div className="space-y-6 fade-in">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Processed Employees" 
              value={data.kpis.total_employees} 
              icon={Users}
              description={<VarianceIndicator value={data.kpis.variances?.employees_variance} label="Active in period" />} 
              variant="info"
            />
            <StatCard 
              title="Net Salary Paid" 
              value={formatCurrency(data.kpis.total_salary_paid)} 
              icon={IndianRupee}
              description={<VarianceIndicator value={data.kpis.variances?.salary_variance} label={`${formatCurrency(data.kpis.total_gross_pay)} Gross`} />} 
              variant="success" 
            />
            <StatCard 
              title="Total Deductions" 
              value={formatCurrency(data.kpis.total_deductions)} 
              icon={Wallet}
              description={<VarianceIndicator value={data.kpis.variances?.deductions_variance} label="Tax & deductions" inverse />} 
              variant="danger" 
            />
            <StatCard 
              title="Pending Payrolls" 
              value={data.kpis.pending_payrolls} 
              icon={FileText}
              description={`${data.kpis.paid_payrolls} paid successfully`} 
              variant={data.kpis.pending_payrolls > 0 ? "warning" : "default"} 
            />
          </div>

          {/* Department Analytics */}
          {data.analytics && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Cost Insights
                </h3>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Highest Cost Department</p>
                    <p className="text-lg font-semibold">{data.analytics.highest_cost_department.name}</p>
                    <p className="text-sm text-emerald-600 font-medium">{formatCurrency(data.analytics.highest_cost_department.cost)}</p>
                  </div>
                  <div className="space-y-2 mt-4">
                    {data.analytics.department_insights.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{d.department}</span>
                        <span className="font-medium">{formatCurrency(d.avg_salary)} <span className="text-xs text-muted-foreground font-normal">avg</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <ChartCard 
                  title="Monthly Payroll Trend" 
                  type="bar" 
                  data={data.charts.monthly_trends.labels.map((label, i) => ({
                    name: label,
                    value: data.charts.monthly_trends.values[i]
                  }))} 
                  colors={["#3b82f6"]} 
                  height={300} 
                />
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold text-lg">Employee Payroll Data</h3>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="p-0">
              <DataTable 
                columns={columns} 
                data={data.data || []} 
                pageSize={10} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Side Panel Drawer */}
      <Sheet open={!!selectedSlip} onOpenChange={(open) => !open && setSelectedSlip(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l shadow-2xl p-0">
          {isLoadingSlip || !slipDetails ? (
            <div className="p-6 space-y-6 animate-pulse mt-8">
              <div className="h-16 bg-muted rounded-xl" />
              <div className="space-y-2"><div className="h-8 bg-muted rounded" /><div className="h-4 bg-muted rounded w-1/2" /></div>
              <div className="h-32 bg-muted rounded-xl" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b bg-muted/10 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{slipDetails.slip_details.employee_name}</h2>
                    <p className="text-sm text-muted-foreground">{slipDetails.slip_details.designation} · {slipDetails.slip_details.department}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                    slipDetails.slip_details.docstatus === 1 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    {slipDetails.slip_details.docstatus === 1 ? "Paid" : "Pending"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-3 bg-card border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Net Payable</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(slipDetails.slip_details.net_pay)}</p>
                  </div>
                  <div className="p-3 bg-card border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Period</p>
                    <p className="text-sm font-medium">{new Date(slipDetails.slip_details.start_date).toLocaleDateString()} - {new Date(slipDetails.slip_details.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8 flex-1">
                {/* Earnings & Deductions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Salary Breakdown</h4>
                  </div>
                  
                  <div className="rounded-xl border overflow-hidden">
                    <div className="p-3 bg-muted/30 border-b flex justify-between font-medium text-sm">
                      <span>Earnings</span>
                      <span className="text-right">{formatCurrency(slipDetails.slip_details.gross_pay)}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {slipDetails.earnings.map((e, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{e.salary_component}</span>
                          <span className="font-medium">{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-muted/30 border-y flex justify-between font-medium text-sm">
                      <span>Deductions</span>
                      <span className="text-right text-rose-500">{formatCurrency(slipDetails.slip_details.total_deduction)}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {slipDetails.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.salary_component}</span>
                          <span className="font-medium text-rose-500">{formatCurrency(d.amount)}</span>
                        </div>
                      ))}
                      {slipDetails.deductions.length === 0 && <p className="text-xs text-muted-foreground italic">No deductions</p>}
                    </div>
                  </div>
                </div>

                {/* Work & Attendance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Work Hours
                    </h4>
                    <div className="p-4 rounded-xl border bg-card">
                      <p className="text-2xl font-bold">{slipDetails.timesheet.total_hours || 0}<span className="text-sm font-normal text-muted-foreground ml-1">hrs</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Logged this period</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" /> Attendance
                    </h4>
                    <div className="p-4 rounded-xl border bg-card space-y-1.5">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Present</span><span className="font-medium">{slipDetails.attendance.present}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Absent</span><span className="font-medium">{slipDetails.attendance.absent}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Leave</span><span className="font-medium">{slipDetails.attendance.leave}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t bg-card flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=Salary%20Slip&name=${selectedSlip}&format=Enterprise%20Salary%20Slip`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.open(`/cadesk365/salary-slip/${selectedSlip}`, '_blank')}
                >
                  View Record <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function PayrollSummaryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading Report...</div>}>
      <PayrollSummaryContent />
    </Suspense>
  );
}
