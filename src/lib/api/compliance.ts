import { callMethod } from "./client";
import type { ComplianceTracker, Customer } from "@/types/api";

interface ComplianceResponse {
  trackers: ComplianceTracker[];
  total: number;
  customers: Customer[];
  compliance_types: string[];
}

export function getComplianceTrackers(args?: {
  customer?: string;
  status?: string;
  compliance_type?: string;
  limit?: number;
  start?: number;
}): Promise<ComplianceResponse> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_compliance_trackers",
    args
  );
}

export function updateComplianceStatus(
  trackerName: string,
  status: string
): Promise<{ name: string; status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.update_compliance_status",
    { tracker_name: trackerName, status }
  );
}

export function getCalendarData(): Promise<unknown> {
  return callMethod("cadesk365.api.get_calendar_data.get_calendar_data");
}
