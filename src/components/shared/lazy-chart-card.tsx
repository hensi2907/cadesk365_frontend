"use client";

import dynamic from "next/dynamic";

export const ChartCard = dynamic(
  () => import("@/components/shared/chart-card").then((mod) => mod.ChartCard),
  {
    ssr: false,
    loading: () => <div className="w-full h-full min-h-[200px] bg-muted/50 animate-pulse rounded-xl" />,
  }
);
