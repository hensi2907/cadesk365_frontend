import { callMethod } from "./client";
import type { DashboardData } from "@/types/api";

export function getDashboardData(refresh = 0): Promise<DashboardData> {
  return callMethod<DashboardData>(
    "cadesk365.api.get_user_task_dashboard.get_user_task_dashboard",
    { refresh }
  );
}

export function logoutUser(): Promise<{ status: string }> {
  return callMethod("cadesk365.api.get_user_task_dashboard.logout_user");
}
