"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Printer, Trash2, Edit2,
  Building2, Users, CalendarClock, Briefcase,
  ShieldCheck, MapPin, Activity, FileText,
  BarChart3, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDoctypeRecord, getDoctypeRecord, deleteDoctypeRecord, getDoctypeList } from "@/lib/api/doctype";
import { getAllUserPermissions } from "@/lib/api/permissions";
import { toast } from "sonner";
import { ComplianceForm, type ComplianceFormValues } from "../_components/compliance-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function ComplianceRecordPage() {
  const router = useRouter();
  const params = useParams();
  const rawRecordName = params?.recordname as string;
  const recordName = rawRecordName ? decodeURIComponent(rawRecordName) : "";

  const [isEditing, setIsEditing] = React.useState(false);

  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions", "Item"],
    queryFn: () => getAllUserPermissions("Item"),
  });

  const { data: record, isLoading: recordLoading, isError, refetch } = useQuery({
    queryKey: ["item", recordName],
    queryFn: () => getDoctypeRecord<any>("Item", recordName),
    retry: 1,
    enabled: !!recordName,
  });

  // Fetch Dashboard Analytics (Active Trackers & Skilled Employees)
  const { data: dashboardData } = useQuery({
    queryKey: ["compliance-dashboard", recordName],
    queryFn: async () => {
      const { callMethod } = await import("@/lib/api/client");
      const res = await callMethod<any>("cadesk365.api.compliance.get_compliance_dashboard_data", {
        record_name: recordName
      });
      return res;
    },
    enabled: !!recordName,
  });

  const activeTrackers = dashboardData?.active_trackers || [];
  const skilledEmployees = dashboardData?.skilled_employees || [];
  const businessEntities = dashboardData?.business_entities || [];


  const deleteMutation = useMutation({
    mutationFn: () => deleteDoctypeRecord("Item", recordName),
    onSuccess: () => {
      toast.success("Compliance record deleted.");
      router.push("/compliance/list");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete record");
    }
  });

  const onSubmit = async (data: ComplianceFormValues) => {
    try {
      const payload = {
        doctype: "Item",
        name: recordName,
        item_group: "CA Service",
        stock_uom: "Service",
        is_sales_item: 1,
        sales_uom: "Service",
        ...data,
        custom_applies_to_all_business_entities: data.custom_applies_to_all_business_entities ? 1 : 0,
      };

      await saveDoctypeRecord(payload);
      toast.success("Compliance record updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update compliance record");
      throw err;
    }
  };

  const handlePrint = () => {
    window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=Item&name=${encodeURIComponent(recordName)}&format=Standard`, '_blank');
  };

  if (recordLoading || permsLoading) {
    return (
      <div className="space-y-6 fluid-container pb-16">
        <div className="flex items-center gap-4 py-4 px-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
          <Skeleton className="h-40 col-span-1 rounded-2xl" />
          <Skeleton className="h-40 col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] col-span-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4 opacity-80" />
        <h2 className="text-xl font-bold text-destructive mb-2">Record Not Found</h2>
        <p className="text-muted-foreground mb-6">The compliance record you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push("/compliance/list")}>Back to List</Button>
      </div>
    );
  }

  const initialData: Partial<ComplianceFormValues> = {
    item_code: record.item_code,
    item_name: record.item_name,
    country_of_origin: record.country_of_origin,
    custom_service_category: record.custom_service_category,
    custom_governing_authority: record.custom_governing_authority,
    description: record.description,
    standard_rate: record.standard_rate || 0,
    custom_applies_to_all_business_entities: record.custom_applies_to_all_business_entities === 1,
    custom_compliance_due_date: Array.isArray(record.custom_compliance_due_date) ? record.custom_compliance_due_date.map((r: any) => ({
      frequency: r.frequency,
      month: r.month,
      date: r.date
    })) : []
  };

  const isReadOnly = !permissions?.write;

  return (
    <div className="space-y-6 fluid-container pb-16">
      {/* Sticky Header Actions */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-30 py-4 transition-all px-2 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-accent/50 rounded-full h-9 w-9">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              {record.item_name || record.item_code}
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase border border-primary/20">
                {record.custom_service_category || "Service"}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {record.country_of_origin || "Global"}</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {record.custom_governing_authority || "N/A"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && !isReadOnly && (
            <Button
              onClick={() => setIsEditing(true)}
              className="rounded-full px-5 shadow-md shadow-primary/10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Compliance
            </Button>
          )}

          {permissions?.print && !isEditing && (
            <Button variant="outline" className="rounded-full px-4 border-border/50 hover:bg-accent/50 transition-all font-semibold" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          )}

          {permissions?.delete && !isEditing && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" className="rounded-full px-4 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-all font-semibold text-red-500 shadow-sm"><Trash2 className="h-4 w-4" /></Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Compliance Record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete <strong>{recordName}</strong>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ComplianceForm
            initialData={initialData}
            onSubmit={onSubmit}
            isReadOnly={isReadOnly}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="space-y-6 px-2 animate-in fade-in duration-500">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Standard Rate</p>
              <h3 className="text-2xl font-bold tracking-tight">{record.standard_rate || "0.00"}</h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-blue-500" /> Base billing rate
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Applicability</p>
              <h3 className="text-xl font-bold tracking-tight mt-1">
                {record.custom_applies_to_all_business_entities ? "All Entities" : "Specific Entities"}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-emerald-500" /> Across registered clients
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Due Date Rules</p>
              <h3 className="text-2xl font-bold tracking-tight">{initialData.custom_compliance_due_date?.length || 0}</h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-amber-500" /> Active filing cycles
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Trackers</p>
              <h3 className="text-2xl font-bold tracking-tight">{activeTrackers?.length || 0}</h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Activity className="h-3 w-3 text-purple-500" /> Pending client filings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Details & Due Dates */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description Card */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  Compliance Description
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {record.description ? (
                    <div dangerouslySetInnerHTML={{ __html: record.description }} />
                  ) : (
                    <p className="italic opacity-70">No description provided for this compliance requirement.</p>
                  )}
                </div>
              </div>

              {/* Due Date Rules Timeline/Table */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <CalendarClock className="h-5 w-5 text-amber-500" />
                  Filing Cycle & Due Dates
                </h3>

                {initialData.custom_compliance_due_date && initialData.custom_compliance_due_date.length > 0 ? (
                  <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
                    {initialData.custom_compliance_due_date.map((rule: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-amber-500 ring-4 ring-background"></span>
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/40 hover:border-amber-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              {rule.frequency}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              Due: <span className="text-amber-600 dark:text-amber-400">Day {rule.date}</span>
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            {rule.month ? `Occurs in ${rule.month}` : "Occurs based on frequency schedule"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">
                    <CalendarClock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No due date rules configured.</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    Applicable Business Entities
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ml-2">
                      {businessEntities.length}
                    </span>
                  </h3>
                  {record.custom_applies_to_all_business_entities === 1 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Active Entities
                    </span>
                  )}
                </div>

                {businessEntities && businessEntities.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/50">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border/50">
                        <tr>
                          <th className="px-4 py-3">Business Entity Name</th>
                          <th className="px-4 py-3">Company Type</th>
                          <th className="px-4 py-3">Country</th>
                          <th className="px-4 py-3">Linked Clients</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {businessEntities.map((entity: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">
                              <span
                                className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                                onClick={() => router.push(`/cadesk365/business-entity/${encodeURIComponent(entity.id)}`)}
                              >
                                {entity.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{entity.type}</td>
                            <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <MapPin className="h-3.5 w-3.5 opacity-70" /> {entity.country}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
                                {entity.linked_clients} Clients
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                entity.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                              )}>
                                {entity.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-xl border border-dashed border-border/50">
                    <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <h4 className="text-sm font-semibold text-foreground mb-1">No Business Entities Linked</h4>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                      This compliance is not currently applicable to any specific business entities.
                      Edit the compliance to link it or update compliance profiles.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Operational Intelligence */}
            <div className="space-y-6">

              {/* Active Trackers Summary */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Active Trackers
                  </h3>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">View All</Button>
                </div>

                <div className="space-y-3">
                  {activeTrackers?.map((tracker: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => router.push(`/cadesk365/compliance-tracker/${encodeURIComponent(tracker.id)}`)}
                      className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tracker.client}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          tracker.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            tracker.status === 'Overdue' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {tracker.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="hover:underline">{tracker.id}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tracker.due}</span>
                      </div>
                    </div>
                  ))}
                  {(!activeTrackers || activeTrackers.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active trackers found.</p>
                  )}
                </div>
              </div>

              {/* Skilled Employees Dynamic Display */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Skilled Team ({skilledEmployees?.length || 0})
                  </h3>
                </div>

                {skilledEmployees && skilledEmployees.length > 0 ? (
                  <div className="space-y-3">
                    {skilledEmployees.map((emp: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                              {emp.name ? emp.name.substring(0, 2).toUpperCase() : "EM"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{emp.name}</span>
                              <span className="text-xs text-muted-foreground">{emp.designation}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Active
                          </span>
                        </div>
                        {emp.department && (
                          <div className="text-[11px] text-muted-foreground bg-background rounded-md px-2 py-1 mt-1 border border-border/50 inline-flex w-fit">
                            Dept: {emp.department}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p>No employees currently have this compliance listed as a skill. Assign this compliance to employees to build your skilled team.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Applicable Business Entities Section */}
          {/* <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Applicable Business Entities
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ml-2">
                  {businessEntities.length}
                </span>
              </h3>
              {record.custom_applies_to_all_business_entities === 1 && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Active Entities
                </span>
              )}
            </div>

            {businessEntities && businessEntities.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3">Business Entity Name</th>
                      <th className="px-4 py-3">Company Type</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Linked Clients</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {businessEntities.map((entity: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span 
                            className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                            onClick={() => router.push(`/cadesk365/business-entity/${encodeURIComponent(entity.id)}`)}
                          >
                            {entity.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{entity.type}</td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 opacity-70" /> {entity.country}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
                            {entity.linked_clients} Clients
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                            entity.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                          )}>
                            {entity.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-xl border border-dashed border-border/50">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-semibold text-foreground mb-1">No Business Entities Linked</h4>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                  This compliance is not currently applicable to any specific business entities. 
                  Edit the compliance to link it or update compliance profiles.
                </p>
              </div>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}

