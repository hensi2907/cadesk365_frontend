import { callMethod } from "./client";
import type { ToDo } from "@/types/api";
import type { Task, TaskStatus } from "@/types/task-management";

export function getTodosForKanban(
  filterType?: string,
  customer?: string,
  compliance?: string
): Promise<ToDo[]> {
  return callMethod<ToDo[]>(
    "cadesk365.api.get_todos_for_kanban.get_todos_for_kanban",
    { filter_type: filterType, customer, compliance }
  );
}

export function createTodo(args: {
  description: string;
  allocated_to: string;
  date?: string;
  customer?: string;
  compliance?: string;
  priority?: string;
}): Promise<{ name: string; status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.create_todo",
    args
  );
}

export function updateTodoStatus(
  todoName: string,
  status: string,
  customTempStatus?: string
): Promise<{ name: string; status: string }> {
  return callMethod(
    "cadesk365.api.get_user_task_dashboard.update_todo_status",
    { todo_name: todoName, status, custom_temp_status: customTempStatus }
  );
}

export function updateTodoForKanban(
  todoName: string,
  status: string,
  customTempStatus?: string
): Promise<{ name: string }> {
  return callMethod(
    "cadesk365.api.update_todo_for_kanban.update_todo_for_kanban",
    { todo_name: todoName, status:status, custom_temp_status: customTempStatus }
  );
}

export async function updateTodoStatusWithSetValues(
  todoName: string,
  status: string,
  customTempStatus: string
): Promise<{ name: string }> {
  // First update status
  await callMethod("frappe.client.set_value", {
    doctype: "ToDo",
    name: todoName,
    fieldname: "status",
    value: status
  });
  
  // Then update temp status
  await callMethod("frappe.client.set_value", {
    doctype: "ToDo",
    name: todoName,
    fieldname: "custom_temp_status",
    value: customTempStatus
  });
  
  return { name: todoName };
}

// New dynamic API functions
export interface DashboardData {
  my_todos_todos_open: ToDo[];
  todos_assigned_by_me: ToDo[];
  all_open_todos: ToDo[];
  completed_todos: ToDo[];
  todos_grouped_by_employee: Record<string, ToDo[]>;
  user: string;
  total_compliance: number;
  total_customers: number;
  compliance_due_this_month: number;
  overdue_count: number;
  completed_compliances: number;
  can_allocate: boolean;
}

export function getDashboardData(refresh: boolean = false): Promise<DashboardData> {
  return callMethod<DashboardData>(
    "cadesk365.api.get_user_task_dashboard.get_user_task_dashboard",
    { refresh: refresh ? 1 : 0 }
  );
}


export function updateTaskAllocation(
  todoName: string,
  newAssignee: string
): Promise<any> {
  return callMethod(
    "frappe.client.set_value",
    { doctype: "ToDo", name: todoName, fieldname: "allocated_to", value: newAssignee }
  );
}

export function getEmployeeList(): Promise<Array<{
  name: string;
  full_name: string;
}>> {
  return callMethod(
    "frappe.client.get_list",
    {
      doctype: "User",
      fields: ["name", "full_name"],
      filters: { name: ["not in", ["Administrator", "Guest"]] },
      limit_page_length: 1000
    }
  );
}

// Transform ToDo to Task
export function transformToDoToTask(todo: ToDo): Task {
  const status = todo.status === "Closed" ? "Closed" : 
    (todo.custom_temp_status === "Review Pending" || todo.custom_temp_status === "Review pending" || todo.custom_temp_status === "Review") ? "Review Pending" :
    todo.custom_temp_status === "Working" ? "Working" : "Open";

  return {
    id: todo.name,
    name: todo.name,
    description: todo.description || "",
    status: status as TaskStatus,
    priority: (todo.priority as any) || "Normal",
    allocated_to: todo.allocated_to || undefined,
    assigned_by: todo.assigned_by || undefined,
    date: todo.date || undefined,
    due_date: todo.date || undefined,
    customer: todo.custom_customer || undefined,
    compliance: todo.custom_compliance || undefined,
    labels: [],
    created_at: undefined,
    updated_at: undefined,
    custom_started_working_on: todo.custom_started_working_on || undefined,
    custom_completed_on: todo.custom_completed_on || undefined,
    custom_customer: todo.custom_customer || undefined,
    custom_compliance: todo.custom_compliance || undefined,
    custom_allocated_to_by_name: todo.custom_allocated_to_by_name || undefined,
  };
}
