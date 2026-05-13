// ── Frappe API response types ──

export interface FrappeResponse<T = unknown> {
  message: T;
  exc?: string;
  _server_messages?: string;
}

export interface FrappeListResponse<T = unknown> {
  data: T[];
}

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  filters_applied?: Record<string, unknown>;
  error?: string;
}

// ── ToDo ──
export interface ToDo {
  name: string;
  description: string;
  allocated_to: string;
  assigned_by: string;
  owner: string;
  date: string | null;
  status: "Open" | "Closed";
  priority?: string;
  custom_customer?: string;
  custom_compliance?: string;
  custom_allocated_to_by_name?: string;
  custom_temp_status?: string;
  custom_completed_on?: string;
  custom_started_working_on?: string;
  custom_client_service?: string;
  // computed
  on_time?: number;
  overdue_days?: number;
  duration_days?: number;
}

// ── Compliance Tracker ──
export interface ComplianceTracker {
  name: string;
  customer: string;
  compliance: string;
  status: string;
  due_date: string;
  frequency?: string;
  custom_assigned_to?: string;
  custom_proof_document?: string;
  custom_attach_proof?: string;
  completed_on?: string;
}

// ── Customer ──
export interface Customer {
  name: string;
  customer_name: string;
  customer_type?: string;
  gstin?: string;
  pan?: string;
  custom_business_entity?: string;
  custom_country?: string;
  mobile_no?: string;
  email_id?: string;
}

// ── Client Summary ──
export interface ClientSummary {
  client: string;
  active: number;
  completed: number;
  overdue: number;
}

// ── Client Detail ──
export interface ClientDetail {
  customer_name: string;
  customer_type: string;
  gstin: string;
  pan: string;
  custom_business_entity: string;
  custom_country: string;
  mobile_no: string;
  email_id: string;
  trackers: ComplianceTracker[];
  open_tasks: ToDo[];
}

// ── Employee ──
export interface Employee {
  name: string;
  employee_name: string;
  designation: string;
  department: string;
  user_id: string;
  company_email?: string;
  open_tasks?: number;
}

// ── Employee Profile (Settings/HRMS) ──
export interface EmployeeProfile {
  employee_id: string;
  employee_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  date_of_joining: string;
  blood_group: string;
  personal_email: string;
  company_email: string;
  cell_phone: string;
  emergency_phone: string;
  current_address: string;
  permanent_address: string;
  company: string;
  designation: string;
  department: string;
  branch: string;
  reports_to: string;
  reports_to_name: string;
  ctc: number;
  salary_mode: string;
  bank_name: string;
  bank_ac_no: string;
  ifsc_code: string;
  status: string;
  image: string;
}

// ── Dashboard Data ──
export interface DashboardData {
  user: string;
  email: string;
  roles: string[];
  can_allocate: boolean;
  is_high_level: boolean;
  employee_id: string;
  permitted_doctypes: string[];
  default_company: string;

  // Todos
  my_todos_todos_open: ToDo[];
  my_todos_todos_open_due_today: ToDo[];
  todos_assigned_by_me: ToDo[];
  todos_assigned_by_me_due_today: ToDo[];
  all_open_todos: ToDo[];
  all_open_todos_due_today: ToDo[];
  completed_todos: ToDo[];
  todos_grouped_by_employee: Record<string, ToDo[]>;

  // Dashboard
  total_customers: number;
  total_compliance: number;
  compliance_due_this_month: number;

  // Client
  client_summary: ClientSummary[];

  // Compliance
  total_compliances: number;
  pending_compliances: number;
  completed_compliances: number;
  overdue_count: number;
  overdue_list: ComplianceTracker[];
  active_compliance_list: ComplianceTracker[];
  compliance_by_type: Record<string, number>;

  // Charts
  chart_status: { labels: string[]; values: number[] };
  chart_type: { labels: string[]; values: number[] };

  // Notes & Reminders
  note: Array<{ name: string; title: string; content: string }>;
  reminder_list: ReminderItem[];
}

// ── HRMS ──
export interface AttendanceRecord {
  name: string;
  attendance_date: string;
  status: string;
  working_hours: number;
  late_entry: number;
  early_exit: number;
  leave_type?: string;
}

export interface AttendanceData {
  records: AttendanceRecord[];
  present: number;
  absent: number;
  half_day: number;
  work_from_home: number;
  on_leave: number;
  total: number;
  month: number;
  year: number;
  month_label: string;
}

export interface LeaveApplication {
  name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  posting_date: string;
}

export interface LeaveBalance {
  leave_type: string;
  allocated: number;
  used: number;
  balance: number;
}

export interface Holiday {
  holiday_date: string;
  description: string;
  weekly_off: number;
}

export interface LeaveData {
  records: LeaveApplication[];
  leave_balances: LeaveBalance[];
  holidays: Holiday[];
}

export interface ExpenseClaim {
  name: string;
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  status: string;
  posting_date: string;
  approval_status: string;
  expense_type?: string;
}

export interface ExpenseData {
  records: ExpenseClaim[];
  pending: number;
  approved: number;
  rejected: number;
  total_claimed: number;
  advance_balance: number;
}

export interface SalarySlip {
  name: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  net_pay: number;
  gross_pay: number;
  total_deduction: number;
}

export interface SalaryData {
  records: SalarySlip[];
}

export interface CheckinRecord {
  name: string;
  time: string;
  log_type: "IN" | "OUT";
  device_id?: string;
}

export interface CheckinData {
  records: CheckinRecord[];
  last_log_type: string | null;
  next_action: "IN" | "OUT";
}

// ── Notifications ──
export interface NotificationLog {
  name: string;
  subject: string;
  type: string;
  read: number;
  document_type: string;
  document_name: string;
  from_user: string;
  creation: string;
}

export interface ReminderItem {
  name: string;
  remind_at: string;
  user: string;
  description: string;
  reminder_doctype: string;
  reminder_docname: string;
  notified?: boolean;
}

export interface NotificationData {
  notifications: NotificationLog[];
  unread_count: number;
  reminders: ReminderItem[];
  upcoming_reminders: number;
}

// ── Client Documents ──
export interface ClientDocument {
  name: string;
  client: string;
  document_type: string;
  attach_document?: string;
  reference_record?: string;
  reference_doctype?: string;
  description?: string;
  creation: string;
  modified?: string;
}

export interface ClientDocumentData {
  documents: ClientDocument[];
  total: number;
  grouped: Record<string, ClientDocument[]>;
  clients: string[];
}

// ── Performance Report ──
export interface ProductivityMetric {
  label: string;
  value: number;
}

export interface InsightItem {
  type: "pos" | "warn" | "neu";
  text: string;
}

export interface OverdueTaskBreakdown {
  total: number;
  open: number;
  completed: number;
  ignored: number;
}

export interface ClientStat {
  client: string;
  total_compliances: number;
  completed: number;
  pending: number;
  overdue: number;
  on_time_percent: number;
  pending_overdue: number;
  pending_on_time: number;
}

export interface EmployeePerformanceReport {
  employee_name: string;
  designation: string;
  department: string;

  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;

  overdue_tasks: OverdueTaskBreakdown;

  on_time_percent: number;
  overdue_percent: number;
  utilization_percent: number;
  avg_completion_days: number;

  performance_score: number;
  performance_label: string;

  monthly_task_completion: { labels: string[]; values: number[] };
  client_stats: ClientStat[];
  client_services: string[];
  compliances: ComplianceTracker[];

  productivity: ProductivityMetric[];
  insights: InsightItem[];

  // Team ranking (merged in frontend)
  ranking?: TeamRankingEntry[];
}

export interface TeamRankingEntry {
  employee_id: string;
  name: string;
  score: number;
  rank: number;
  is_current: boolean;
}

// ── Calendar ──
export interface CalendarEvent {
  item: string;
  month: string;
  date: string;
  frequency: string;
}

// ── Client Portal ──
export interface ClientPortalData {
  customer: {
    name: string;
    customer_name: string;
    mobile_no: string;
  };
  records: ComplianceTracker[];
  documents: ClientDocument[];
}
