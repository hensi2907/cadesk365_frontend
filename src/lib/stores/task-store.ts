import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Task, TaskState, TaskActions, TaskTab, TaskView, TaskFilter, TaskSort, TableColumn, TaskStatus } from "@/types/task-management";

const DEFAULT_COLUMNS: TableColumn[] = [
  { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
  { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
  { key: "status", label: "Status", visible: true, sortable: true, width: "120px" },
  { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
  { key: "allocated_to", label: "Assigned To", visible: true, sortable: true, width: "150px" },
  { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
  { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
  { key: "created_at", label: "Created", visible: false, sortable: true, width: "120px" },
  { key: "updated_at", label: "Updated", visible: false, sortable: true, width: "120px" },
];

const INITIAL_FILTERS: TaskFilter = {
  search: "",
  status: [],
  priority: [],
  assigned_to: [],
  customer: [],
};

const INITIAL_SORT: TaskSort = {
  field: "name",
  direction: "desc",
};

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()(
  devtools(
    (set, get) => ({
      // State
      tasks: [],
      loading: false,
      error: null,
      currentTab: "my-tasks",
      currentView: "kanban",
      filters: INITIAL_FILTERS,
      sort: INITIAL_SORT,

      columns: DEFAULT_COLUMNS,
      searchQuery: "",

      // Actions
      setTasks: (tasks) => set({ tasks }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setCurrentTab: (tab) => set({ currentTab: tab }),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      setFilters: (filters) => set({ filters }),
      
      setSort: (sort) => set({ sort }),
      

      
      setColumns: (columns) => set({ columns }),
      
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      })),
      
      moveTask: (taskId, newStatus, newAssignee) => set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                status: newStatus,
                ...(newAssignee && { allocated_to: newAssignee }),
                updated_at: new Date().toISOString(),
              }
            : task
        ),
      })),
      

      
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: `TASK-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      })),
      
      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
      })),
      
      resetFilters: () => set({
        filters: INITIAL_FILTERS,
        searchQuery: "",
        sort: INITIAL_SORT,
      }),
    }),
    {
      name: "task-store",
    }
  )
);

// Selectors for derived state
export const useFilteredTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const filters = useTaskStore((state) => state.filters);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const sort = useTaskStore((state) => state.sort);

  return tasks.filter((task) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !task.name.toLowerCase().includes(query) &&
        !task.description.toLowerCase().includes(query) &&
        !task.customer?.toLowerCase().includes(query) &&
        !task.allocated_to?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) return false;
    }

    // Assigned to filter
    if (filters.assigned_to && filters.assigned_to.length > 0) {
      if (!task.allocated_to || !filters.assigned_to.includes(task.allocated_to)) return false;
    }

    // Customer filter
    if (filters.customer && filters.customer.length > 0) {
      if (!task.customer || !filters.customer.includes(task.customer)) return false;
    }

    // Date range filter
    if (filters.date_range) {
      if (task.date) {
        const taskDate = new Date(task.date);
        const startDate = new Date(filters.date_range.start);
        const endDate = new Date(filters.date_range.end);
        if (taskDate < startDate || taskDate > endDate) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sort.direction === "desc" ? -comparison : comparison;
  });
};

export const useTasksByStatus = () => {
  const filteredTasks = useFilteredTasks();
  
  return filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);
};

export const useTaskStats = () => {
  const tasks = useTaskStore((state) => state.tasks);
  
  return {
    total: tasks.length,
    byStatus: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>),
    byPriority: tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    overdue: tasks.filter(task => 
      task.date && new Date(task.date) < new Date() && task.status !== "Closed"
    ).length,
    dueToday: tasks.filter(task => 
      task.date && 
      new Date(task.date).toDateString() === new Date().toDateString() &&
      task.status !== "Closed"
    ).length,
  };
};
