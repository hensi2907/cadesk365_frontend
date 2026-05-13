import { callMethod } from "./client";
import type { Customer, ClientDetail, Employee } from "@/types/api";

// Client API functions
export function getClientList(): Promise<Customer[]> {
  return callMethod<Customer[]>(
    "cadesk365.api.get_user_task_dashboard.get_client_list"
  );
}

export function getEmployeeList(): Promise<Employee[]> {
  return callMethod<Employee[]>(
    "cadesk365.api.get_user_task_dashboard.get_employee_list"
  );
}

export function getClientDetail(customerName: string): Promise<ClientDetail> {
  return callMethod<ClientDetail>(
    "cadesk365.api.get_user_task_dashboard.get_client_detail",
    { customer_name: customerName }
  );
}

export function getCustomerComplianceSummary(customerName: string, refresh = 0): Promise<{
  customers: Customer[];
  compliance_types: Array<{ name: string }>;
}> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_customer_compliance_summary",
    { customer: customerName, refresh }
  );
}

export function getComplianceTrackers(
  customer?: string,
  status?: string,
  complianceType?: string,
  limit = 100,
  start = 0
): Promise<{
  trackers: Array<{
    name: string;
    customer: string;
    status: string;
    due_date: string;
    frequency: string;
    assigned_to?: string;
    proof_document?: string;
  }>;
  total: number;
  customers: Customer[];
  compliance_types: Array<{ name: string }>;
}> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_compliance_trackers",
    { customer, status, complianceType: complianceType, limit, start }
  );
}

export function updateComplianceStatus(trackerName: string, status: string): Promise<{ name: string; status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.update_compliance_status",
    { tracker_name: trackerName, status }
  );
}
