"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Tag,
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
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { getRecordRoute } from "@/lib/utils/route";
import type { Task, TaskCardProps, TaskPriority } from "@/types/task-management";

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

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAssigneeChange,
  draggable = false,
  compact = false,
  showActions = true,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.date && new Date(task.date) < new Date() && task.status !== "Closed";
  const isDueToday = task.date && new Date(task.date).toDateString() === new Date().toDateString();

  return (
    <motion.div
      ref={setNodeRef}
      style={draggable ? style : undefined}
      className={cn(
        "rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 group",
        draggable && "cursor-grab active:cursor-grabbing",
        !draggable && "cursor-pointer",
        "hover:border-border hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-40 scale-[0.96] rotate-1",
        isOverdue && "border-red-200 bg-red-50/50",
        compact ? "p-3" : "p-4"
      )}
      {...attributes}
      {...(draggable ? listeners : undefined)}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {draggable && (
          <div className="flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40 mt-0.5 shrink-0 transition-colors" />
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors",
                compact ? "text-xs" : "text-sm"
              )}>
                {task.description}
              </h3>
              {task.description && !compact && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description.replace(/<[^>]*>/g, "")}
                </p>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-accent rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = getRecordRoute("ToDo", task.name);
                  }}>
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Priority and Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              
                {/* Due Date */}

              {task.date && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
                isOverdue
                  ? "bg-red-100 text-red-700"
                  : isDueToday
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted/60 text-muted-foreground/70"
              )}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.date)}
              </div>
            )}
            </div>
            <StatusBadge status={task.status} size="sm" />
          </div>

          {/* Labels */}
          {task.labels.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 2).map((label) => (
                <Badge key={label} variant="outline" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {label}
                </Badge>
              ))}
              {task.labels.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.labels.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
          
      

            {/* Assigned User */}
            {task.allocated_to && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className=" max-w-[80px]">
                  {task.custom_allocated_to_by_name || task.allocated_to.split("@")[0]}
                </span>
              </div>
            )}
          </div>

          {/* Customer/Compliance Info (if not compact) */}
          {!compact && (task.customer || task.compliance) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
              {task.customer && (
                <span className="truncate">
                  📁 {task.customer}
                </span>
              )}
              {task.compliance && (
                <span className="truncate">
                  📋 {task.compliance}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
