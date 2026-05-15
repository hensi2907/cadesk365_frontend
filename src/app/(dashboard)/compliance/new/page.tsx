"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { insertDoctypeRecord } from "@/lib/api/doctype";
import { toast } from "sonner";
import { getRecordRoute } from "@/lib/utils/route";
import { ComplianceForm, type ComplianceFormValues } from "../_components/compliance-form";

export default function NewCompliancePage() {
  const router = useRouter();
  
  const onSubmit = async (data: ComplianceFormValues) => {
    try {
      const payload = {
        doctype: "Item",
        item_group: "CA Service",
        stock_uom: "Service",
        is_sales_item: 1,
        sales_uom: "Service",
        ...data,
        custom_applies_to_all_business_entities: data.custom_applies_to_all_business_entities ? 1 : 0,
      };

      const res = await insertDoctypeRecord(payload);
      toast.success("Compliance record created successfully!");
      router.push(getRecordRoute("Item", res.name));
    } catch (err: any) {
      toast.error(err.message || "Failed to create compliance record");
    }
  };

  return (
    <div className="space-y-6 fluid-container pb-16">
      <div className="flex items-center gap-4 sticky top-0 bg-transparent z-30 py-4 transition-all px-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-accent/50 rounded-full h-9 w-9">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <PageHeader title="New Compliance" description="Create a new compliance record." />
      </div>

      <ComplianceForm 
        onSubmit={onSubmit} 
        onCancel={() => router.back()} 
      />
    </div>
  );
}
