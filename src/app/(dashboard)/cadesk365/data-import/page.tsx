"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Hammer } from "lucide-react";

export default function DataImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Import"
        description="Import records to your database"
      />
      
      <div className="flex flex-col items-center justify-center p-24 border border-border/40 rounded-xl bg-card/40 text-center">
        <Hammer className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Feature Coming Soon</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          We are currently building the custom data import functionality. Check back later!
        </p>
      </div>
    </div>
  );
}
