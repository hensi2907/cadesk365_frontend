import { callMethod } from "./client";

export function getHrmsData(
  tab: string,
  month?: number,
  year?: number
): Promise<Record<string, unknown>> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_hrms_data",
    { tab, month, year }
  );
}

export function doEmployeeCheckin(
  logType: "IN" | "OUT"
): Promise<{ name: string; log_type: string; time: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.do_employee_checkin",
    { log_type: logType }
  );
}

export function getEmployeeList(): Promise<
  Array<{
    name: string;
    employee_name: string;
    designation: string;
    department: string;
    user_id: string;
    open_tasks: number;
  }>
> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.get_employee_list"
  );
}

export function getPerformanceReport(
  employee: string
): Promise<any> {
  return callMethod(
    "cadesk365.api.calculate_employee_performance_report.calculate_employee_performance_report",
    { employee }
  );
}

export function getTeamRanking(
  employee: string
): Promise<{ ranking: Array<{ rank: number; name: string; score: number; is_current: boolean }> }> {
  return callMethod(
    "cadesk365.api.calculate_team_ranking.calculate_team_ranking",
    { employee }
  );
}

export function getEmployeeProfile(
  employeeId: string
): Promise<Record<string, any>> {
  return callMethod("frappe.client.get", {
    doctype: "Employee",
    name: employeeId,
  });
}

export function updateEmployeeProfile(
  employeeId: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  return callMethod("frappe.client.set_value", {
    doctype: "Employee",
    name: employeeId,
    fieldname: data,
  });
}
