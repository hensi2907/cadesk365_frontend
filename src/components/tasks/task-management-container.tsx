"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  List,
  LayoutGrid,
  Search,
  X,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRecordRoute, getNewRecordRoute } from "@/lib/utils/route";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "./kanban-board";
import { DynamicTaskTable } from "./dynamic-task-table";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskViewToggle } from "./task-view-toggle";
import { AllocationBoard } from "./allocation-board";
import { useTaskStore, useFilteredTasks, useTasksByStatus } from "@/lib/stores/task-store";
import { transformToDoToTask, getEmployeeList, updateTodoStatusWithSetValues, updateTodoForKanban } from "@/lib/api/tasks";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import type { TaskTab, TaskView, TaskTabConfig, TaskColumn, Task, TaskStatus } from "@/types/task-management";

import { useRouter } from "next/navigation";

// Default columns configuration
const DEFAULT_COLUMNS: TaskColumn[] = [
  { key: "Open", label: "Open", color: "bg-blue-500", lightColor: "from-blue-500/10 to-blue-500/5", countColor: "bg-blue-500/10 text-blue-500" },
  { key: "Working", label: "Working", color: "bg-amber-500", lightColor: "from-amber-500/10 to-amber-500/5", countColor: "bg-amber-500/10 text-amber-500" },
  { key: "Review Pending", label: "Review Pending", color: "bg-purple-500", lightColor: "from-purple-500/10 to-purple-500/5", countColor: "bg-purple-500/10 text-purple-500" },
  { key: "Closed", label: "Closed", color: "bg-emerald-500", lightColor: "from-emerald-500/10 to-emerald-500/5", countColor: "bg-emerald-500/10 text-emerald-500" },
];

// Tab configurations
const TAB_CONFIGS: Record<TaskTab, TaskTabConfig> = {
  "my-tasks": {
    id: "my-tasks",
    title: "My Tasks",
    description: "Tasks assigned to you",
    apiEndpoint: "/api/method/cadesk365.api.get_user_task_dashboard.get_user_task_dashboard",
    filters: {},
    columns: [
      { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
      { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
      { key: "status", label: "Status", visible: true, sortable: true, width: "120px" },
      { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
      { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
      { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
      { key: "allocated_to", label: "Assigned To", visible: false, sortable: true, width: "150px" },
    ],
    allowCreate: true,
    allowEdit: true,
    allowDelete: false,
  },
  "all-tasks": {
    id: "all-tasks",
    title: "All Tasks",
    description: "All tasks across the organization",
    apiEndpoint: "/api/method/cadesk365.api.get_all_tasks.get_all_tasks",
    filters: {},
    columns: [
      { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
      { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
      { key: "status", label: "Status", visible: true, sortable: true, width: "120px" },
      { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
      { key: "allocated_to", label: "Assigned To", visible: true, sortable: true, width: "150px" },
      { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
      { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
      { key: "assigned_by", label: "Assigned By", visible: false, sortable: true, width: "150px" },
    ],
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
  },
  "allotted-by-me": {
    id: "allotted-by-me",
    title: "Allotted by Me",
    description: "Tasks you assigned to others",
    apiEndpoint: "/api/method/cadesk365.api.get_tasks_by_me.get_tasks_by_me",
    filters: {},
    columns: [
      { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
      { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
      { key: "status", label: "Status", visible: true, sortable: true, width: "120px" },
      { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
      { key: "allocated_to", label: "Assigned To", visible: true, sortable: true, width: "150px" },
      { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
      { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
    ],
    allowCreate: true,
    allowEdit: true,
    allowDelete: false,
  },
  "completed": {
    id: "completed",
    title: "Completed",
    description: "Completed tasks",
    apiEndpoint: "/api/method/cadesk365.api.get_completed_tasks.get_completed_tasks",
    filters: { status: ["Closed"] },
    columns: [
      { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
      { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
      { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
      { key: "allocated_to", label: "Assigned To", visible: true, sortable: true, width: "150px" },
      { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
      { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
      { key: "custom_completed_on", label: "Completed On", visible: true, sortable: true, width: "120px" },
    ],
    allowCreate: false,
    allowEdit: false,
    allowDelete: false,
  },
  "allocate": {
    id: "allocate",
    title: "Allocate",
    description: "Allocate tasks to team members",
    apiEndpoint: "/api/method/cadesk365.api.get_unallocated_tasks.get_unallocated_tasks",
    filters: {},
    columns: [
      { key: "name", label: "ID", visible: true, sortable: true, width: "100px" },
      { key: "description", label: "Description", visible: true, sortable: true, width: "300px" },
      { key: "priority", label: "Priority", visible: true, sortable: true, width: "100px" },
      { key: "customer", label: "Customer", visible: true, sortable: true, width: "150px" },
      { key: "date", label: "Due Date", visible: true, sortable: true, width: "120px" },
    ],
    allowCreate: false,
    allowEdit: false,
    allowDelete: false,
  },
};

interface TaskManagementContainerProps {
  tab: TaskTab;
  readOnly?: boolean;
}

export function TaskManagementContainer({ tab, readOnly = false }: TaskManagementContainerProps) {
  const router = useRouter();
  const tabConfig = TAB_CONFIGS[tab];
  const {
    tasks,
    loading,
    error,
    currentView,
    filters,
    sort,

    columns,
    searchQuery,
    setCurrentView,
    setFilters,
    setSort,
    setSearchQuery,
    updateTask,
    deleteTask,
    resetFilters,
  } = useTaskStore();

  const filteredTasks = useFilteredTasks();
  const tasksByStatus = useTasksByStatus();

  // Real API calls
  const { data: apiData, isLoading: apiLoading, refetch } = useDashboard(1);


  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const userList = await getEmployeeList();
      return userList.map(user => ({
        id: user.name, // The user email
        name: user.full_name,
        email: user.name,
        open_tasks: 0,
        compliances: 0,
      }));
    },
  });

  React.useEffect(() => {
    if (apiData) {
      // Transform API data based on tab
      let tasks: any[] = [];

      switch (tab) {
        case "my-tasks":
          tasks = apiData.my_todos_todos_open || [];
          break;
        case "all-tasks":
          tasks = apiData.all_open_todos || [];
          break;
        case "allotted-by-me":
          tasks = apiData.todos_assigned_by_me || [];
          break;
        case "completed":
          tasks = apiData.completed_todos || [];
          break;
        case "allocate":
          // For allocate, show all open tasks so they can be re-allocated
          tasks = apiData.all_open_todos || [];
          break;
        default:
          tasks = apiData.all_open_todos || [];
      }

      const transformedTasks = tasks.map(transformToDoToTask);
      useTaskStore.getState().setTasks(transformedTasks);
    }
  }, [apiData, tab]);

  React.useEffect(() => {
    const store = useTaskStore.getState();
    store.setCurrentTab(tab);

    // Force list view for completed tab
    if (tab === "completed" && store.currentView !== "list") {
      store.setCurrentView("list");
    }

    // Removed forced kanban view for allocate tab so users can use the toggle

    // Only update columns if they actually changed
    if (JSON.stringify(store.columns) !== JSON.stringify(tabConfig.columns)) {
      store.setColumns(tabConfig.columns);
    }

    // Only update filters if they actually changed
    if (JSON.stringify(store.filters) !== JSON.stringify(tabConfig.filters)) {
      store.setFilters(tabConfig.filters);
    }
  }, [tab, tabConfig.columns, tabConfig.filters]);

  const queryClient = useQueryClient();

  const taskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus, newAssignee, previousTask }: any) => {
      // 1. Update status if it changed
      if (newStatus && previousTask?.status !== newStatus) {
        if (newStatus === "Closed") {
          // await updateTodoStatusWithSetValues(taskId, "Closed", "");
          await updateTodoForKanban(taskId, "Closed", "")
        } else if (newStatus === "Open") {
          // await updateTodoStatusWithSetValues(taskId, "Open", "");
          await updateTodoForKanban(taskId, "Open", "")
        } else if (newStatus === "Working") {
          // await updateTodoStatusWithSetValues(taskId, "Open", "");
          await updateTodoForKanban(taskId, "Open", "Working")
        } else {
          const tempStatus = newStatus === "Review Pending" ? "Review Pending" : newStatus;
          // await updateTodoStatusWithSetValues(taskId, "Open", tempStatus);
          await updateTodoForKanban(taskId, "Open", tempStatus)
        }
      }

      // 2. Update allocation if it changed
      if (newAssignee !== undefined && newAssignee !== previousTask?.allocated_to) {
        const { updateTaskAllocation } = await import("@/lib/api/tasks");
        await updateTaskAllocation(taskId, newAssignee === "__UNASSIGNED__" ? "" : newAssignee);
      }
    },
    onMutate: async ({ taskId, newStatus, newAssignee, previousTask }) => {
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Optimistic update
      updateTask(taskId, {
        ...(newStatus && { status: newStatus }),
        ...(newAssignee !== undefined && { allocated_to: newAssignee === "__UNASSIGNED__" ? "" : newAssignee })
      });

      return { previousTask };
    },
    onError: (err, variables, context: any) => {
      console.error("Failed to update task:", err);
      // Revert if API fails
      if (context?.previousTask) {
        updateTask(variables.taskId, {
          status: context.previousTask.status,
          allocated_to: context.previousTask.allocated_to
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleTaskMove = (taskId: string, newStatus: TaskStatus, newAssignee?: string) => {
    const previousTask = useTaskStore.getState().tasks.find(t => t.id === taskId);
    taskMutation.mutate({ taskId, newStatus, newAssignee, previousTask });
  };

  const handleTaskAllocate = (taskId: string, employeeId: string) => {
    const previousTask = useTaskStore.getState().tasks.find(t => t.id === taskId);
    taskMutation.mutate({ taskId, newAssignee: employeeId, previousTask });
  };

  const handleTaskEdit = (task: Task) => {
    // Open task edit modal
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleTaskSelect = (taskId: string) => {
    router.push(getRecordRoute("ToDo", taskId));
  };

  const handleAddTask = () => {
    router.push(getNewRecordRoute("ToDo"));
  };


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">Error loading tasks: {error}</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fluid-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{tabConfig.title}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            {loading || apiLoading ? "Loading..." : `${filteredTasks.length} tasks`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 w-52 rounded-xl border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
              </button>
            )}
          </div>

          {/* View Toggle - Only show if not completed tab */}
          {tab !== "completed" && (
            <TaskViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              disabled={loading || apiLoading}
            />
          )}


          {/* Reset Filters */}
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl h-9" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* Add Task */}
          {tabConfig.allowCreate && !readOnly && (
            <Button size="sm" className="gap-1.5 rounded-xl h-9 !bg-primary/70 hover:bg-primary/90 text-white shadow-lg shadow-[#1e3a8a]/20" onClick={handleAddTask}>
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
          )}
        </div>
      </motion.div>



      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tab === "allocate" ? (
          currentView === "list" ? (
            <DynamicTaskTable
              tasks={filteredTasks}
              columns={columns}
              filters={filters}
              sort={sort}
              onFiltersChange={setFilters}
              onSortChange={setSort}
              onTaskSelect={handleTaskSelect}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              loading={loading || apiLoading}
              readOnly={readOnly}
            />
          ) : (
            <AllocationBoard
              tasks={filteredTasks}
              employees={employees || []}
              onTaskAllocate={handleTaskAllocate}
              loading={loading || apiLoading || employeesLoading}
            />
          )
        ) : (
          <>
            {tab === "completed" || currentView === "list" ? (
              <DynamicTaskTable
                tasks={filteredTasks}
                columns={columns}
                filters={filters}
                sort={sort}
                onFiltersChange={setFilters}
                onSortChange={setSort}
                onTaskSelect={handleTaskSelect}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}

                loading={loading || apiLoading}
                readOnly={readOnly}
              />
            ) : (
              <KanbanBoard
                tasks={filteredTasks}
                columns={DEFAULT_COLUMNS}
                onTaskMove={handleTaskMove}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                loading={loading || apiLoading}
                readOnly={readOnly}
              />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

