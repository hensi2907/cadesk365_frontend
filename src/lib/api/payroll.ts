import { callMethod } from "./client";

export interface PayrollFilters {
  start_date?: string;
  end_date?: string;
  department?: string;
  employee?: string;
  status?: string;
}

export interface PayrollKPIs {
  total_employees: number;
  total_salary_paid: number;
  total_gross_pay: number;
  total_deductions: number;
  pending_payrolls: number;
  paid_payrolls: number;
  variances?: {
    salary_variance: number;
    deductions_variance: number;
    employees_variance: number;
  };
}

export interface PayrollCharts {
  department_distribution: Array<{ name: string; value: number }>;
  monthly_trends: {
    labels: string[];
    values: number[];
  };
}

export interface DepartmentInsight {
  department: string;
  total_cost: number;
  employee_count: number;
  avg_salary: number;
}

export interface PayrollAnalytics {
  department_insights: DepartmentInsight[];
  highest_cost_department: {
    name: string;
    cost: number;
  };
}

export interface SalarySlip {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  start_date: string;
  end_date: string;
  docstatus: number;
  status: string;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
  posting_date: string;
}

export interface PayrollSummaryResponse {
  kpis: PayrollKPIs;
  charts: PayrollCharts;
  analytics?: PayrollAnalytics;
  data: SalarySlip[];
}

export async function getPayrollSummary(
  filters?: PayrollFilters
): Promise<PayrollSummaryResponse> {
  const payload: any = {};
  if (filters) {
    payload.filters = JSON.stringify(filters);
  }
  
  const response = await callMethod<PayrollSummaryResponse>(
    "cadesk365.api.payroll_summary.get_payroll_summary",
    payload
  );
  
  return response;
}

export interface PayrollDetailsResponse {
  slip_details: SalarySlip & {
    payment_days: number;
    leave_without_pay: number;
  };
  earnings: Array<{ salary_component: string; amount: number }>;
  deductions: Array<{ salary_component: string; amount: number }>;
  attendance: {
    present: number;
    absent: number;
    leave: number;
    half_day: number;
    holiday: number;
  };
  timesheet: {
    total_hours: number;
    total_billed_hours: number;
  };
}

export async function getEmployeePayrollDetails(
  salarySlipName: string
): Promise<PayrollDetailsResponse> {
  const response = await callMethod<PayrollDetailsResponse>(
    "cadesk365.api.payroll_details.get_employee_payroll_details",
    { salary_slip_name: salarySlipName }
  );
  return response;
}
