"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const DataTable = dynamic(
  () => import("@/components/shared/data-table").then((mod) => mod.DataTable),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
) as any;
