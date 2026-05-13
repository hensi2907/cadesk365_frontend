"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LinkField } from "@/components/shared/link-field";
import { callMethod } from "@/lib/api/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface FieldData {
  fieldname: string;
  label: string;
  fieldtype: string;
}

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

const OPERATORS = [
  "=", "!=", "like", "in", "not in", ">", "<", ">=", "<=", "between", "is"
];

export default function DataExportPage() {
  const [selectedDoctype, setSelectedDoctype] = React.useState<string>("");
  const [fields, setFields] = React.useState<FieldData[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  const [selectedFields, setSelectedFields] = React.useState<Set<string>>(new Set());
  const [fieldSearch, setFieldSearch] = React.useState("");

  const [filters, setFilters] = React.useState<FilterCondition[]>([]);

  const [fileType, setFileType] = React.useState<"csv" | "xlsx">("csv");
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    if (!selectedDoctype) {
      setFields([]);
      setSelectedFields(new Set());
      setFilters([]);
      return;
    }

    const fetchFields = async () => {
      setLoadingFields(true);
      try {
        const res = await callMethod<FieldData[]>("cadesk365.api.data_export.get_doctype_fields", {
          doctype: selectedDoctype
        });
        setFields(res);
        // Select all by default
        setSelectedFields(new Set(res.map(f => f.fieldname)));
        setFilters([]);
      } catch (err: any) {
        toast.error("Failed to fetch DocType fields: " + (err.message || "Unknown error"));
        setFields([]);
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFields();
  }, [selectedDoctype]);

  const filteredFields = React.useMemo(() => {
    if (!fieldSearch) return fields;
    const lowerSearch = fieldSearch.toLowerCase();
    return fields.filter(f =>
      f.label.toLowerCase().includes(lowerSearch) ||
      f.fieldname.toLowerCase().includes(lowerSearch)
    );
  }, [fields, fieldSearch]);

  const toggleField = (fieldname: string) => {
    const next = new Set(selectedFields);
    if (next.has(fieldname)) {
      next.delete(fieldname);
    } else {
      next.add(fieldname);
    }
    setSelectedFields(next);
  };

  const handleSelectAll = () => {
    if (selectedFields.size === fields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(fields.map(f => f.fieldname)));
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: fields[0]?.fieldname || "", operator: "=", value: "" }]);
  };

  const updateFilter = (index: number, key: keyof FilterCondition, val: string) => {
    const next = [...filters];
    next[index][key] = val;
    setFilters(next);
  };

  const removeFilter = (index: number) => {
    const next = [...filters];
    next.splice(index, 1);
    setFilters(next);
  };

  const handleExport = async () => {
    if (!selectedDoctype) {
      toast.error("Please select a DocType");
      return;
    }
    if (selectedFields.size === 0) {
      toast.error("Please select at least one field to export");
      return;
    }

    // Prepare payload
    const exportFields = Array.from(selectedFields);
    // Format filters for Frappe: [[field, operator, value], ...]
    const formattedFilters = filters.map(f => [f.field, f.operator, f.value]);

    setIsExporting(true);
    try {
      const res = await callMethod<{ filename: string, filedata: string }>("cadesk365.api.data_export.export_data", {
        doctype: selectedDoctype,
        fields: exportFields,
        filters: formattedFilters,
        file_type: fileType
      });

      // Decode base64 and trigger download
      const binaryString = window.atob(res.filedata);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const mimeType = fileType === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export successful!");
    } catch (err: any) {
      toast.error("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <PageHeader
        title="Data Export"
        description="Select a DocType, choose your fields, apply filters, and export your data safely."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
            <div>
              <Label className="text-base font-semibold">Select DocType</Label>
              <p className="text-xs text-muted-foreground mb-3 mt-1">Choose the record type you want to export.</p>
              <LinkField
                doctype="DocType"
                value={selectedDoctype}
                onChange={setSelectedDoctype}
                placeholder="e.g. Customer"
              />
            </div>

            {selectedDoctype && (
              <div className="pt-4 border-t border-border/50">
                <Label className="text-base font-semibold block mb-3">Export Format</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${fileType === "csv" ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-muted"}`}
                    onClick={() => setFileType("csv")}
                  >
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${fileType === "csv" ? "border-primary" : "border-muted-foreground"}`}>
                      {fileType === "csv" && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-medium">CSV</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${fileType === "xlsx" ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-muted"}`}
                    onClick={() => setFileType("xlsx")}
                  >
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${fileType === "xlsx" ? "border-primary" : "border-muted-foreground"}`}>
                      {fileType === "xlsx" && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-medium">Excel (.xlsx)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fields and Filters */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedDoctype ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground flex flex-col items-center">
              <Download className="h-10 w-10 mb-3 opacity-20" />
              <p>Please select a DocType to load available fields.</p>
            </div>
          ) : loadingFields ? (
            <div className="rounded-xl border p-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Fields Section */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Fields to Export</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedFields.size} of {fields.length} selected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search fields..."
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        className="h-8 pl-8 text-sm w-[160px]"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                      {selectedFields.size === fields.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                    {filteredFields.map(field => (
                      <div key={field.fieldname} className="flex items-start space-x-2">
                        <Checkbox
                          id={`field-${field.fieldname}`}
                          checked={selectedFields.has(field.fieldname)}
                          onCheckedChange={() => toggleField(field.fieldname)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`field-${field.fieldname}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {field.label}
                          </label>
                          <p className="text-[10px] text-muted-foreground">
                            {field.fieldname}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredFields.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                        No fields matching "{fieldSearch}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Data Filters (Optional)</h3>
                    <p className="text-xs text-muted-foreground">Apply filters to limit the exported data.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addFilter} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Filter
                  </Button>
                </div>

                {filters.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                    No filters applied. All records will be exported.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Select value={filter.field} onValueChange={(v) => updateFilter(idx, "field", v || "")}>
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map(f => (
                              <SelectItem key={f.fieldname} value={f.fieldname}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={filter.operator} onValueChange={(v) => updateFilter(idx, "operator", v || "")}>
                          <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op} value={op}>{op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Value..."
                          value={filter.value}
                          onChange={(e) => updateFilter(idx, "value", e.target.value)}
                          className="flex-1 h-9 min-w-[120px]"
                        />

                        <Button variant="ghost" size="icon" onClick={() => removeFilter(idx)} className="h-9 w-9 text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleExport}
                  disabled={isExporting || selectedFields.size === 0}
                  className="bg-primary hover:bg-primary/90 min-w-[180px]"
                >
                  {isExporting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> Export Data</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
