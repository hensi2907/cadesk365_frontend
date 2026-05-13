import { callMethod } from "./client";

export interface AttendanceRecord {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  attendance_date: string;
  status: string;
  working_hours?: number;
  late_entry?: number;
  early_exit?: number;
  shift?: string;
}

export interface CheckinRecord {
  name: string;
  employee: string;
  employee_name: string;
  time: string;
  log_type: string;
  device_id?: string;
}

export interface WorkHourSummary {
  employee: string;
  employee_name: string;
  department: string;
  total_hours: number;
  days_present: number;
  expected_hours: number;
  productivity: number;
}

export interface OvertimeRecord {
  employee: string;
  employee_name: string;
  department: string;
  attendance_date: string;
  working_hours: number;
  standard_hours: number;
  overtime_hours: number;
}

export interface LeaveBalanceRecord {
  employee: string;
  employee_name: string;
  leave_type: string;
  allocated: number;
  used: number;
  pending: number;
  balance: number;
}

export interface LeaveHistoryRecord {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  posting_date: string;
}

export interface AttendanceToolRecord {
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  company: string;
  attendance_name?: string;
  status: string;
  working_hours: number;
  check_in?: string;
  check_out?: string;
}

export interface HRRosterRecord {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  status: string;
  is_holiday?: boolean;
  weekly_off?: boolean;
  is_leave?: boolean;
  description?: string;
}

export interface ShiftType {
  name: string;
  start_time: string;
  end_time: string;
}

export function getAttendanceReport(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string,
  status?: string
): Promise<AttendanceRecord[]> {
  return callMethod("cadesk365.api.attendance_reports.get_employee_attendance_report", {
    from_date,
    to_date,
    employee,
    department,
    status,
  });
}

export function getDailyCheckinReport(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string
): Promise<CheckinRecord[]> {
  return callMethod("cadesk365.api.attendance_reports.get_daily_checkin_report", {
    from_date,
    to_date,
    employee,
    department,
  });
}

export function getLateArrivalReport(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string
): Promise<AttendanceRecord[]> {
  return callMethod("cadesk365.api.attendance_reports.get_late_arrival_report", {
    from_date,
    to_date,
    employee,
    department,
  });
}

export function getWorkHoursSummary(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string
): Promise<WorkHourSummary[]> {
  return callMethod("cadesk365.api.work_hour_reports.get_work_hours_summary", {
    from_date,
    to_date,
    employee,
    department,
  });
}

export function getOvertimeReport(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string,
  standard_hours?: number
): Promise<OvertimeRecord[]> {
  return callMethod("cadesk365.api.work_hour_reports.get_overtime_report", {
    from_date,
    to_date,
    employee,
    department,
    standard_hours,
  });
}

export function getLeaveBalanceReport(
  employee?: string,
  department?: string
): Promise<LeaveBalanceRecord[]> {
  return callMethod("cadesk365.api.leave_reports.get_leave_balance_report", {
    employee,
    department,
  });
}

export function getLeaveHistoryReport(
  from_date?: string,
  to_date?: string,
  employee?: string,
  department?: string,
  status?: string
): Promise<LeaveHistoryRecord[]> {
  return callMethod("cadesk365.api.leave_reports.get_leave_history_report", {
    from_date,
    to_date,
    employee,
    department,
    status,
  });
}

export function getAttendanceToolData(
  date: string,
  company?: string,
  department?: string,
  employee?: string,
  designation?: string
): Promise<AttendanceToolRecord[]> {
  return callMethod("cadesk365.api.attendance_tool.get_attendance_data", {
    date,
    company,
    department,
    employee,
    designation,
  });
}

export function markBulkAttendance(
  date: string,
  employees: string[],
  status: string
): Promise<{ status: string; marked_count: number }> {
  return callMethod("cadesk365.api.attendance_tool.mark_bulk_attendance", {
    date,
    employees: JSON.stringify(employees),
    status,
  });
}

export function getHRRosterData(
  from_date: string,
  to_date: string,
  department?: string,
  employee?: string,
  shift_type?: string
): Promise<HRRosterRecord[]> {
  return callMethod("cadesk365.api.hr_roster.get_roster_data", {
    from_date,
    to_date,
    department,
    employee,
    shift_type,
  });
}

export function getShiftTypes(): Promise<ShiftType[]> {
  return callMethod("cadesk365.api.hr_roster.get_shift_types", {});
}

export function getEmployeesByDepartment(department?: string): Promise<{ name: string, employee_name: string, department: string }[]> {
  return callMethod("cadesk365.api.hr_roster.get_employees_by_department", { department });
}

export function assignBulkRoster(
  employees: string[],
  shift_type: string,
  start_date: string,
  end_date: string
): Promise<{ status: string; assigned_count: number; errors: string[] }> {
  return callMethod("cadesk365.api.hr_roster.bulk_assign_shifts", {
    employees: JSON.stringify(employees),
    shift_type,
    start_date,
    end_date,
  });
}

export function deleteShiftAssignment(assignment_id: string): Promise<{ status: string }> {
  return callMethod("cadesk365.api.hr_roster.delete_shift_assignment", {
    assignment_id,
  });
}

export function updateShiftAssignment(
  assignment_id: string,
  new_employee: string,
  new_date: string,
  origin_date: string
): Promise<{ status: string; new_assignment: string }> {
  return callMethod("cadesk365.api.hr_roster.update_shift_assignment", {
    assignment_id,
    new_employee,
    new_date,
    origin_date,
  });
}
