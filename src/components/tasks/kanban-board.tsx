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
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import {
  GripVertical,
  Calendar,
  User,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import type { Task, TaskColumn, TaskBoardProps, TaskStatus, TaskPriority, DragItem } from "@/types/task-management";
import { TaskCard } from "./task-card";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: "bg-blue-50 text-blue-700 border-blue-200",
  Normal: "bg-gray-50 text-gray-700 border-gray-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};

const getPriorityIcon = (priority: TaskPriority) => {
  switch (priority) {
    case "Critical": return "🔴";
    case "High": return "🟠";
    case "Normal": return "🟡";
    case "Low": return "🔵";
    default: return "⚪";
  }
};

interface SortableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

function SortableTaskCard({ task, onEdit, onDelete }: SortableTaskCardProps) {
  return (
    <TaskCard
      task={task}
      onEdit={() => onEdit?.(task)}
      onDelete={() => onDelete?.(task.id)}
      draggable
      compact
      showActions
    />
  );
}

export function KanbanBoard({
  tasks,
  columns,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  loading = false,
  readOnly = false,
}: TaskBoardProps) {
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

  // Group tasks by status
  const tasksByColumn = React.useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.key] = tasks.filter(task => task.status === column.key);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [tasks, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setDraggedTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    
    if (activeTask && overTask) {
      // Handle reordering within the same column
      if (activeTask.status === overTask.status) {
        const oldIndex = tasksByColumn[activeTask.status].findIndex(t => t.id === active.id);
        const newIndex = tasksByColumn[activeTask.status].findIndex(t => t.id === over.id);
        
        if (oldIndex !== newIndex) {
          const newTasks = arrayMove(tasksByColumn[activeTask.status], oldIndex, newIndex);
          // Update the tasks array with the new order
          const updatedTasks = tasks.map(task => {
            if (task.status === activeTask.status) {
              const newIndexInColumn = newTasks.findIndex(t => t.id === task.id);
              return { ...task, order: newIndexInColumn };
            }
            return task;
          });
          // This would typically update the store
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      setDraggedTask(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumn = columns.find(col => col.key === over.id);
    
    if (activeTask && overColumn) {
      // Handle moving to a different column
      if (activeTask.status !== overColumn.key) {
        onTaskMove(activeTask.id, overColumn.key);
      }
    }
    
    const overTask = tasks.find(t => t.id === over.id);
    if (activeTask && overTask && activeTask.id !== overTask.id) {
      // Handle moving to a different position in the same or different column
      const newStatus = overTask.status;
      if (activeTask.status !== newStatus) {
        onTaskMove(activeTask.id, newStatus);
      }
    }





    setActiveTask(null);
    setDraggedTask(null);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setDraggedTask(null);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.key} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 min-h-[400px]">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              tasks={tasksByColumn[column.key] || []}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              readOnly={readOnly}
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
                showActions={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  readOnly?: boolean;
}

function KanbanColumn({ column, tasks, onTaskEdit, onTaskDelete, readOnly }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-card/50 flex flex-col min-h-[400px] transition-all duration-300",
        isOver
          ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/20 scale-[1.01]"
          : "border-border/60"
      )}
    >
      {/* Column Header */}
      <div className={cn("flex items-center justify-between p-4 rounded-t-2xl bg-gradient-to-r", column.lightColor)}>
        <div className="flex items-center gap-2.5">
          <div className={cn("h-2.5 w-2.5 rounded-full", column.color)} />
          <span className="text-[13px] font-bold">{column.label}</span>
        </div>
        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", column.countColor)}>
          {tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
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
                <SortableTaskCard
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                />
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-28 text-xs text-muted-foreground/40 border border-dashed border-border/40 rounded-xl">
              Drop tasks here
            </div>
          )}
        </SortableContext>
      </div>

      
    </div>
  );
}
