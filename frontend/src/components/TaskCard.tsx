import { motion } from "framer-motion";
import { Clock, Calendar, MoreVertical, Edit2, Trash2, Check, RotateCcw, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  onReopen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TaskCard = ({ task, onComplete, onReopen, onEdit, onDelete }: TaskCardProps) => {
  const isCompleted = task.status === 'completed';
  const displayDate = task.due_date || 'No date';
  const displayTime = task.due_time || 'No time';
  const displayDuration = task.duration_minutes ? `${task.duration_minutes} min` : null;
  const wasReopened = task.reopened === true;
  const cooldownUntil = task.reopen_cooldown_until;
  const isOnCooldown = cooldownUntil && new Date(cooldownUntil) > new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`task-card glass-card rounded-xl p-4 flex items-start gap-4 ${isCompleted ? "opacity-60" : ""
        }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </h3>
          {wasReopened && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden sm:inline">Completion was reversed</span>
              <span className="sm:hidden">Reversed</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{displayTime}</span>
          </div>
          {displayDuration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{displayDuration}</span>
            </div>
          )}
          {isCompleted && task.completed_at && (
            <div className="flex items-center gap-1 text-xs">
              <Check className="w-3 h-3" />
              <span>Completed {new Date(task.completed_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start md:self-center mt-1 md:mt-0">
        {isCompleted ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReopen?.(task.id)}
            className="gap-1 text-xs px-2 md:px-3"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reopen Task</span>
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onComplete?.(task.id)}
            disabled={isOnCooldown}
            className="gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/85 px-2 md:px-3"
            title={isOnCooldown ? "Cooldown active. You cannot re-complete this task yet." : undefined}
          >
            <Check className="w-3 h-3" />
            <span className="hidden md:inline">{isOnCooldown ? "Cooldown Active" : "Mark as Completed"}</span>
          </Button>
        )}

        <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-medium ${isCompleted
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning"
          }`}>
          {isCompleted ? "Completed" : "Pending"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(task.id)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(task.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default TaskCard;
