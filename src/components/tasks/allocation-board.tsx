"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Users, Briefcase, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import type { Task, TaskStatus } from "@/types/task-management";
import { TaskCard } from "./task-card";
import { updateTaskAllocation } from "@/lib/api/tasks";

interface Employee {
  id: string;
  name: string;
  email: string;
  open_tasks: number;
  compliances: number;
}

interface AllocationBoardProps {
  tasks: Task[];
  employees: Employee[];
  onTaskAllocate: (taskId: string, employeeId: string) => void;
  loading?: boolean;
}

export function AllocationBoard({
  tasks,
  employees,
  onTaskAllocate,
  loading = false,
}: AllocationBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by employee (unassigned tasks go to "__UNASSIGNED__")
  const tasksByEmployee = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {
      "__UNASSIGNED__": tasks.filter(task => !task.allocated_to || !employees.some(e => e.id === task.allocated_to)),
    };

    employees.forEach(employee => {
      grouped[employee.id] = tasks.filter(task => task.allocated_to === employee.id);
    });

    return grouped;
  }, [tasks, employees]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setDraggedTask(task);
    }
  };

  const uniqueEmployees = Array.from(
    new Map(
      employees.map((emp, index) => [
        `${emp.id || emp.email || emp.name}-${index}`,
        {
          ...emp,
          __uniqueKey:
            `${emp.id || emp.email || emp.name}-${index}`,
        },
      ])
    ).values()
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      setDraggedTask(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    let targetId = String(over.id);

    // If we dropped over an employee column
    if (targetId.startsWith("employee-")) {
      targetId = targetId.replace("employee-", "");
    } else {
      // Dropped over a task
      const overTask = tasks.find(t => t.id === targetId);
      if (overTask) {
        targetId = overTask.allocated_to || "__UNASSIGNED__";
      }
    }
    if (activeTask) {
      const currentAllocated = activeTask.allocated_to || "__UNASSIGNED__";
      if (targetId !== currentAllocated) {
        onTaskAllocate(activeTask.id, targetId);
      }

    }

    setActiveTask(null);
    setDraggedTask(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 min-h-[300px]">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Task Allocation</h2>
        <span className="text-sm text-muted-foreground">
          Drag tasks to assign them to employees
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Employee Columns */}
          {/* {employees.map((employee) => (
           */}
          {uniqueEmployees.map((employee, index) => (
            <EmployeeColumn
              key={employee.__uniqueKey}
              id={employee.id}
              name={employee.name}
              email={employee.email}
              tasks={tasksByEmployee[employee.id] || []}
              color="border-primary/20 bg-primary/5"
              icon={<User className="h-4 w-4" />}
              stats={{
                tasks: employee.open_tasks,
                compliances: employee.compliances,
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard
                task={activeTask}
                draggable={false}
                compact
                showActions={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface EmployeeColumnProps {
  id: string;
  name: string;
  email?: string;
  tasks: Task[];
  color: string;
  icon: React.ReactNode;
  stats?: {
    tasks: number;
    compliances: number;
  };
}



function EmployeeColumn({
  id,
  name,
  email,
  tasks,
  color,
  icon,
  stats,
}: EmployeeColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `employee-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border bg-card flex flex-col min-h-[300px] transition-all duration-300",
        isOver ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/20 scale-[1.01]" : color
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-primary">{icon}</div>
          <h3 className="font-semibold text-sm">{name}</h3>
        </div>

        {email && (
          <p className="text-xs text-muted-foreground mb-2">{email}</p>
        )}

        {stats && (
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.tasks} tasks
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.compliances} compliances
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <TaskCard
                  task={task}
                  draggable
                  compact
                  showActions={true}
                />
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40 border border-dashed border-border/40 rounded-lg">
              Drop tasks here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
