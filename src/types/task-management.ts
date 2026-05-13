export type TaskStatus = "Open" | "Working" | "Review Pending" | "Closed";
export type TaskPriority = "Low" | "Normal" | "High" | "Critical";
export type TaskView = "kanban" | "list";
export type TaskTab = "my-tasks" | "all-tasks" | "allotted-by-me" | "completed" | "allocate";

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  allocated_to?: string;
  assigned_by?: string;
  date?: string;
  due_date?: string;
  customer?: string;
  compliance?: string;
  labels: string[];
  created_at?: string;
  updated_at?: string;
  custom_started_working_on?: string;
  custom_completed_on?: string;
  custom_customer?: string;
  custom_compliance?: string;
  custom_allocated_to_by_name?: string;
}

export interface TaskColumn {
  key: TaskStatus;
  label: string;
  color: string;
  lightColor: string;
  countColor: string;
}

export interface TaskFilter {
  search?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string[];
  customer?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface TaskSort {
  field: keyof Task;
  direction: "asc" | "desc";
}

export interface TableColumn {
  key: keyof Task;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

export interface TaskTabConfig {
  id: TaskTab;
  title: string;
  description: string;
  apiEndpoint: string;
  filters: TaskFilter;
  columns: TableColumn[];
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
}

export interface DragItem {
  task: Task;
  index: number;
  column: TaskStatus;
}

export interface DragOverEvent {
  active: DragItem;
  over: {
    id: string;
    data?: {
      column?: TaskStatus;
      task?: Task;
    };
  };
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentTab: TaskTab;
  currentView: TaskView;
  filters: TaskFilter;
  sort: TaskSort;

  columns: TableColumn[];
  searchQuery: string;
}

export interface TaskActions {
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTab: (tab: TaskTab) => void;
  setCurrentView: (view: TaskView) => void;
  setFilters: (filters: TaskFilter) => void;
  setSort: (sort: TaskSort) => void;

  setColumns: (columns: TableColumn[]) => void;
  setSearchQuery: (query: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newAssignee?: string) => void;

  addTask: (task: Omit<Task, "id">) => void;
  deleteTask: (taskId: string) => void;
  resetFilters: () => void;
}

export interface TaskBoardProps {
  tasks: Task[];
  columns: TaskColumn[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, newAssignee?: string) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  loading?: boolean;
  readOnly?: boolean;
}

export interface TaskTableProps {
  tasks: Task[];
  columns: TableColumn[];
  filters: TaskFilter;
  sort: TaskSort;
  onFiltersChange: (filters: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  loading?: boolean;
  readOnly?: boolean;
}

export interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  onAssigneeChange?: (assignee: string) => void;
  draggable?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

export interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface TaskFilterBarProps {
  filters: TaskFilter;
  onFiltersChange: (filters: TaskFilter) => void;
  availableFilters: {
    statuses: TaskStatus[];
    priorities: TaskPriority[];
    assignees: string[];
    customers: string[];
  };
  onReset: () => void;
}

export interface TaskViewToggleProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  disabled?: boolean;
}
