import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/api/dashboard";
import type { DashboardData } from "@/types/api";

export function useDashboard(refresh = 0) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(refresh),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
