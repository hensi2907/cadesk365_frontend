"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ArrowLeft, Loader2, Send, CheckCircle2, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { saveDoctypeRecord, insertDoctypeRecord, submitDoctypeRecord, getPrintFormats, deleteDoctypeRecord } from "@/lib/api/doctype";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRecordRoute } from "@/lib/utils/route";
import { FieldRenderer } from "./engine/field-renderer";
import { useFetchFrom } from "./engine/hooks/use-fetch-from";
import type { DocType, DocField } from "@/types/frappe";
import type { DocTypePermissions } from "@/lib/api/permissions";

interface DynamicFormProps {
  doctypeMeta: DocType;
  permissions: DocTypePermissions;
  initialData?: any;
  isNew?: boolean;
}

export function DynamicForm({ doctypeMeta, permissions, initialData, isNew = false }: DynamicFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formData, setFormData] = React.useState<any>(initialData || {});
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const { handleFetchFrom } = useFetchFrom(doctypeMeta.fields);

  // Document states
  const docstatus = formData.docstatus || 0;
  const isDraft = docstatus === 0;
  const isSubmitted = docstatus === 1;
  const isCancelled = docstatus === 2;

  // Permissions and visibility
  const isReadOnly = (!permissions.write && !isNew) || isSubmitted || isCancelled;
  const canSubmit = doctypeMeta.is_submittable === 1 && permissions.submit && !isNew && isDraft;
  const canPrint = permissions.print && !isNew;
  const canDelete = permissions.delete && !isNew;
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData || {});

  const [printFormat, setPrintFormat] = React.useState<string>("Standard");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);

  const { data: printFormats } = useQuery({
    queryKey: ["print-formats", doctypeMeta.name],
    queryFn: () => getPrintFormats(doctypeMeta.name),
    enabled: isPrintDialogOpen && canPrint,
  });

  const handlePrint = () => {
    window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(doctypeMeta.name)}&name=${encodeURIComponent(formData.name)}&format=${encodeURIComponent(printFormat)}`, '_blank');
    setIsPrintDialogOpen(false);
  };

  // Initialize defaults if new
  React.useEffect(() => {
    if (isNew && !initialData) {
      const defaults: any = {};
      doctypeMeta.fields.forEach((f) => {
        if (f.default !== undefined && f.default !== null) {
          defaults[f.fieldname] = f.default;
        }
      });
      setFormData(defaults);
    }
  }, [isNew, initialData, doctypeMeta]);

  const handleChange = React.useCallback((fieldname: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldname]: value }));
    
    // Handle fetch_from
    handleFetchFrom(fieldname, value, (updates) => {
      setFormData((prev: any) => ({ ...prev, ...updates }));
    });

    // Clear error for the field when it is changed
    setFormErrors((prev) => {
      if (prev[fieldname]) {
        const newErrs = { ...prev };
        delete newErrs[fieldname];
        return newErrs;
      }
      return prev;
    });
  }, [handleFetchFrom]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    doctypeMeta.fields.forEach((field) => {
      // Check mandatory fields that are visible
      if (field.reqd === 1 && field.hidden !== 1) {
        const val = formData[field.fieldname];
        if (val === undefined || val === null || val === "") {
          errors[field.fieldname] = "This field is mandatory";
        }
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstField}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

      import("sonner").then((mod) => mod.toast.error("Validation Error", { description: "Please fill all mandatory fields" }));
      return false;
    }
    return true;
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const isSingle = doctypeMeta.issingle === 1;

      // Filter out empty data for new records
      let payload = { ...data };
      if (isNew) {
        payload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );
      }

      if (isSingle) {
        // Single DocTypes are always updated. Their name is exactly their DocType name.
        return saveDoctypeRecord({ doctype: doctypeMeta.name, name: doctypeMeta.name, ...payload });
      }

      if (isNew) {
        return insertDoctypeRecord({ doctype: doctypeMeta.name, ...payload });
      } else {
        return saveDoctypeRecord({ doctype: doctypeMeta.name, name: payload.name, ...payload });
      }
    },
    onSuccess: (res: any) => {
      const isSingle = doctypeMeta.issingle === 1;

      if (isSingle) {
        import("sonner").then((mod) => mod.toast.success(`${doctypeMeta.name} saved successfully`));
        // Redirect to the canonical Single DocType route
        router.replace(getRecordRoute(doctypeMeta.name, doctypeMeta.name));
        return;
      }

      // Redirect to the canonical route format globally for all standard doctypes
      if (res.name) {
        router.replace(getRecordRoute(doctypeMeta.name, res.name));
      }
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to save document";
      const errors: Record<string, string> = {};

      // Attempt to map backend error messages to specific fields
      doctypeMeta.fields.forEach(field => {
        if (msg.includes(field.label || field.fieldname)) {
          errors[field.fieldname] = msg;
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        const firstField = Object.keys(errors)[0];
        const el = document.getElementById(`field-${firstField}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      import("sonner").then((mod) => mod.toast.error("Server Error", { description: msg }));
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return submitDoctypeRecord({ doctype: doctypeMeta.name, ...data });
    },
    onSuccess: (res: any) => {
      import("sonner").then((mod) => mod.toast.success(`${doctypeMeta.name} submitted successfully`));

      // Update local form state immediately to reflect submission
      setFormData((prev: any) => ({ ...prev, docstatus: 1 }));

      // Invalidate react-query cache to ensure fresh data on next load
      queryClient.invalidateQueries({
        queryKey: ["doctype-record", doctypeMeta.name, res.name || formData.name]
      });

      router.refresh();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to submit document";
      const errors: Record<string, string> = {};

      doctypeMeta.fields.forEach(field => {
        if (msg.includes(field.label || field.fieldname)) {
          errors[field.fieldname] = msg;
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        const firstField = Object.keys(errors)[0];
        const el = document.getElementById(`field-${firstField}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      import("sonner").then((mod) => mod.toast.error("Submit Error", { description: msg }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return deleteDoctypeRecord(doctypeMeta.name, formData.name);
    },
    onSuccess: () => {
      import("sonner").then((mod) => mod.toast.success(`${doctypeMeta.name} deleted successfully`));
      queryClient.invalidateQueries({ queryKey: ["doctype-list", doctypeMeta.name] });
      router.replace(getRecordRoute(doctypeMeta.name, ""));
    },
    onError: (err: any) => {
      import("sonner").then((mod) => mod.toast.error("Delete Error", { description: err?.message || "Failed to delete document" }));
    }
  });

  // Group fields logically by Section Break
  const sections = React.useMemo(() => {
    const _sections: { title: string; fields: DocField[] }[] = [];
    let currentSection: { title: string; fields: DocField[] } = { title: "", fields: [] };

    doctypeMeta.fields.forEach((field) => {
      if (field.fieldtype === "Section Break") {
        if (currentSection.fields.length > 0 || currentSection.title) {
          _sections.push(currentSection);
        }
        currentSection = { title: field.label || "", fields: [] };
      } else if (field.fieldtype !== "Column Break" && field.fieldtype !== "Tab Break") {
        // Skip hidden fields (could also evaluate depends_on here if we wanted client side logic)
        if (field.hidden !== 1) {
          currentSection.fields.push(field);
        }
      }
    });

    if (currentSection.fields.length > 0) {
      _sections.push(currentSection);
    }

    return _sections;
  }, [doctypeMeta.fields]);

  return (
    <div className="space-y-8 fluid-container pb-16">

      <div className="flex items-center justify-between gap-4 sticky top-0 bg-transaparent z-30 py-4 transition-all px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-accent/50 rounded-full h-9 w-9">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <PageHeader
            title={isNew ? `New ${doctypeMeta.name}` : formData.name || doctypeMeta.name}
            description={isNew ? `Create a new record` : ` ${doctypeMeta.name}`}
          />
          {!isNew && (
            <div className="ml-3 mt-1 flex gap-2">
              {doctypeMeta.is_submittable === 1 ? (
                <>
                  {isDraft && <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-500 border border-red-500/20 backdrop-blur-md shadow-sm">Draft</span>}
                  {isSubmitted && <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20 backdrop-blur-md shadow-sm">Submitted</span>}
                  {isCancelled && <span className="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 border border-slate-500/20 backdrop-blur-md shadow-sm">Cancelled</span>}
                </>
              ) : (
                isDirty ? (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20 backdrop-blur-md shadow-sm">Not Saved</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20 backdrop-blur-md shadow-sm">Saved</span>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pr-2">
          {!isReadOnly && (
            <Button
              onClick={() => {
                if (validateForm()) mutation.mutate(formData);
              }}
              disabled={mutation.isPending || submitMutation.isPending}
              variant="outline"
              className="rounded-full px-6 border-border/50 hover:bg-accent/50 transition-all font-semibold"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          )}

          {canSubmit && (
            <Button
              onClick={() => {
                if (validateForm()) submitMutation.mutate(formData);
              }}
              disabled={mutation.isPending || submitMutation.isPending}
              className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-6 transition-all font-semibold"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          )}

          {/* <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap min-w-[140px]">
              Select Print Format
            </label>

            <Select value={printFormat} onValueChange={setPrintFormat}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>

                {printFormats?.map((pf) => (
                  <SelectItem key={pf.name} value={pf.name}>
                    {pf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          {canPrint && (
            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
              <DialogTrigger render={<Button variant="outline" className="rounded-full px-4 border-border/50 hover:bg-accent/50 transition-all font-semibold" />}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Print {doctypeMeta.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 ">

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium whitespace-nowrap min-w-[140px]">
                      Select Print Format
                    </label>

                    <Select value={printFormat} onValueChange={setPrintFormat}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>

                        {printFormats?.map((pf) => (
                          <SelectItem key={pf.name} value={pf.name}>
                            {pf.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div className="space-y-2">
                    <label className="text-sm font-medium ">Select Print Format</label>
                    <Select value={printFormat} onValueChange={setPrintFormat} >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        {printFormats?.map((pf) => (
                          <SelectItem key={pf.name} value={pf.name}>{pf.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                  <Button onClick={handlePrint} className="w-full !bg-primary/80" >
                    Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" className="rounded-full px-4 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-all font-semibold shadow-sm" />}>
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                )}
                <span className="text-red-500">Delete</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the {doctypeMeta.name} record <strong>{formData.name}</strong> from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="space-y-8 mt-8 px-2">
        {sections.map((section, idx) => (
          <div key={idx} className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-8 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {section.title && (
              <h3 className="text-lg font-bold mb-8 pb-4 border-b border-border/30 flex items-center gap-3 relative">
                <div className="h-5 w-1.5 rounded-full bg-primary/70"></div>
                {section.title}
              </h3>
            )}
            <div className="auto-grid auto-grid-lg">
              {section.fields.map((field) => (
                <div
                  key={field.fieldname}
                  className={
                    field.fieldtype === "Text Editor" ||
                      field.fieldtype === "Table" ||
                      field.fieldtype === "Long Text"
                      ? "col-span-full"
                      : ""
                  }
                >
                  <FieldRenderer
                    field={field}
                    value={formData[field.fieldname]}
                    onChange={(val) => handleChange(field.fieldname, val)}
                    formData={formData}
                    readOnly={isReadOnly}
                    error={formErrors[field.fieldname]}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
