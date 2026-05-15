"use client";

import * as React from "react";
import * as z from "zod";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkField } from "@/components/shared/link-field";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const dueRuleSchema = z.object({
  frequency: z.string().min(1, "Frequency is required"),
  month: z.string().min(1, "Month is required"),
  date: z.coerce.number().min(1, "Must be >= 1").max(31, "Must be <= 31"),
});

export const complianceSchema = z.object({
  item_code: z.string().min(1, "Compliance Code is required"),
  item_name: z.string().min(1, "Compliance Name is required"),
  country_of_origin: z.string().min(1, "Country is required"),
  custom_service_category: z.string().optional(),
  custom_governing_authority: z.string().optional(),
  description: z.string().optional(),
  custom_applies_to_all_business_entities: z.boolean().default(false),
  standard_rate: z.coerce.number().optional().default(0),
  custom_compliance_due_date: z.array(dueRuleSchema).optional().default([]),
}).superRefine((data, ctx) => {
  if (!data.custom_compliance_due_date || data.custom_compliance_due_date.length === 0) return;

  const freqMap = new Map<string, typeof data.custom_compliance_due_date>();

  data.custom_compliance_due_date.forEach((row) => {
    if (!freqMap.has(row.frequency)) {
      freqMap.set(row.frequency, []);
    }
    freqMap.get(row.frequency)!.push(row);
  });

  freqMap.forEach((rows, frequency) => {
    // Check duplicates
    const months = rows.map(r => r.month);
    const uniqueMonths = new Set(months);
    if (uniqueMonths.size !== months.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate months found in ${frequency} setup.`,
        path: ["custom_compliance_due_date"],
      });
    }

    // Check count
    let expectedCount = 0;
    if (frequency === "Monthly") expectedCount = 12;
    else if (frequency === "Quarterly") expectedCount = 4;
    else if (frequency === "Half-Yearly") expectedCount = 2;
    else if (frequency === "Yearly") expectedCount = 1;

    if (expectedCount > 0 && rows.length !== expectedCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${frequency} requires exactly ${expectedCount} rows, but found ${rows.length}.`,
        path: ["custom_compliance_due_date"],
      });
    }
  });
});

export type ComplianceFormValues = z.infer<typeof complianceSchema>;

interface ComplianceFormProps {
  initialData?: Partial<ComplianceFormValues>;
  onSubmit: (data: ComplianceFormValues) => Promise<void>;
  isReadOnly?: boolean;
  onCancel?: () => void;
}

export function ComplianceForm({ initialData, onSubmit, isReadOnly = false, onCancel }: ComplianceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      item_code: initialData?.item_code || "",
      item_name: initialData?.item_name || "",
      country_of_origin: initialData?.country_of_origin || "",
      custom_service_category: initialData?.custom_service_category || "",
      custom_governing_authority: initialData?.custom_governing_authority || "",
      description: initialData?.description || "",
      custom_applies_to_all_business_entities: initialData?.custom_applies_to_all_business_entities || false,
      standard_rate: initialData?.standard_rate || 0,
      custom_compliance_due_date: initialData?.custom_compliance_due_date || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_compliance_due_date",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-2">
      {/* Basic Details */}
      <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-8 shadow-sm">
        <h3 className="text-lg font-bold mb-8 pb-4 border-b border-border/30 flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-primary/70"></div>
          Basic Details
        </h3>
        <div className="auto-grid auto-grid-lg">
          <div className="space-y-2">
            <Label htmlFor="item_code" className={errors.item_code ? "text-destructive" : ""}>Item Code <span className="text-destructive">*</span></Label>
            <Input id="item_code" placeholder="e.g. GST-R1" disabled={isReadOnly} {...register("item_code")} className={errors.item_code ? "border-destructive" : ""} />
            {errors.item_code && <p className="text-xs text-destructive">{errors.item_code.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="item_name" className={errors.item_name ? "text-destructive" : ""}>Compliance Name <span className="text-destructive">*</span></Label>
            <Input id="item_name" placeholder="e.g. GST Return 1" disabled={isReadOnly} {...register("item_name")} className={errors.item_name ? "border-destructive" : ""} />
            {errors.item_name && <p className="text-xs text-destructive">{errors.item_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className={errors.country_of_origin ? "text-destructive" : ""}>Country <span className="text-destructive">*</span></Label>
            <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
              <LinkField error={!!errors.country_of_origin} doctype="Country" value={watch("country_of_origin")} onChange={v => setValue("country_of_origin", v, { shouldValidate: true })} />
            </div>
            {errors.country_of_origin && <p className="text-xs text-destructive">{errors.country_of_origin.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Service Category</Label>
            <Select disabled={isReadOnly} value={watch("custom_service_category")} onValueChange={v => setValue("custom_service_category", v)}>
              <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Taxation">Taxation</SelectItem>
                <SelectItem value="Audit">Audit</SelectItem>
                <SelectItem value="ROC">ROC</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Governing Authority</Label>
            <Select disabled={isReadOnly} value={watch("custom_governing_authority")} onValueChange={v => setValue("custom_governing_authority", v)}>
              <SelectTrigger><SelectValue placeholder="Select Authority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GST Department">GST Department</SelectItem>
                <SelectItem value="Income Tax Department">Income Tax Department</SelectItem>
                <SelectItem value="MCA">MCA</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Standard Rate</Label>
            <Input type="number" placeholder="0" disabled={isReadOnly} {...register("standard_rate")} />
          </div>
          <div className="space-y-2 col-span-full">
            <Label>Description</Label>
            <Textarea placeholder="Enter details..." disabled={isReadOnly} {...register("description")} />
          </div>
          <div className="space-y-2 col-span-full flex items-center gap-2 pt-2">
            <Checkbox id="custom_applies_to_all_business_entities" disabled={isReadOnly} checked={watch("custom_applies_to_all_business_entities")} onCheckedChange={v => setValue("custom_applies_to_all_business_entities", !!v)} />
            <Label htmlFor="custom_applies_to_all_business_entities">Applies to all business entities</Label>
          </div>
        </div>
      </div>

      {/* Due Date Rule Table */}
      <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/30">
          <h3 className="text-lg font-bold flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-primary/70"></div>
            Due Date Rules
          </h3>
          {!isReadOnly && (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ frequency: "", month: "", date: 1 })}>
              <Plus className="h-4 w-4 mr-2" /> Add Rule
            </Button>
          )}
        </div>
        
        {errors.custom_compliance_due_date?.root && (
          <div className="mb-4 p-3 rounded bg-red-500/10 text-red-600 text-sm border border-red-500/20">
            {errors.custom_compliance_due_date.root.message}
          </div>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
            No due date rules added.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start p-4 border rounded-lg bg-card/50">
                <div className="space-y-2">
                  <Label className="text-xs">Frequency</Label>
                  <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
                    <LinkField doctype="Frequency" value={watch(`custom_compliance_due_date.${index}.frequency`)} onChange={v => setValue(`custom_compliance_due_date.${index}.frequency`, v, { shouldValidate: true })} />
                  </div>
                  {errors.custom_compliance_due_date?.[index]?.frequency && <p className="text-[10px] text-destructive">{errors.custom_compliance_due_date[index]?.frequency?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Month</Label>
                  <Select disabled={isReadOnly} value={watch(`custom_compliance_due_date.${index}.month`)} onValueChange={v => setValue(`custom_compliance_due_date.${index}.month`, v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.custom_compliance_due_date?.[index]?.month && <p className="text-[10px] text-destructive">{errors.custom_compliance_due_date[index]?.month?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Date (1-31)</Label>
                  <Input type="number" min="1" max="31" disabled={isReadOnly} {...register(`custom_compliance_due_date.${index}.date`)} />
                  {errors.custom_compliance_due_date?.[index]?.date && <p className="text-[10px] text-destructive">{errors.custom_compliance_due_date[index]?.date?.message}</p>}
                </div>
                <div className="pt-7">
                  {!isReadOnly && (
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Save Record
          </Button>
        </div>
      )}
    </form>
  );
}
