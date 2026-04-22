import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, Timer, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { validateTaskInput, getInvalidTaskMessage } from "@/lib/taskValidation";

interface AddTaskDialogProps {
  onTaskCreated: (task: { 
    title: string; 
    due_date?: string; 
    due_time?: string; 
    duration_minutes?: number;
    reminder_minutes?: number;
  }) => Promise<unknown> | unknown;
}

const REMINDER_OPTIONS = [
  { value: "", label: "Select reminder time" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

const AddTaskDialog = ({ onTaskCreated }: AddTaskDialogProps) => {
  const { toast } = useToast();
  const { speakTaskCreated } = useVoiceFeedback();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [duration, setDuration] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDueDate("");
    setDueTime("");
    setDuration("");
    setReminderMinutes("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    const trimmedTitle = title.trim();

    // Validate task input
    const validation = validateTaskInput(trimmedTitle);
    if (!validation.isValid) {
      toast({ variant: "destructive", title: "Invalid Task", description: getInvalidTaskMessage(validation.reason) });
      return;
    }

    if (!dueDate || !dueTime) {
      toast({ variant: "destructive", title: "Error", description: "Please set when this task is due (date and time)" });
      return;
    }

    if (!reminderMinutes) {
      toast({ variant: "destructive", title: "Error", description: "Please select when you want to be reminded" });
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await onTaskCreated({
        title: trimmedTitle,
        due_date: dueDate,
        due_time: dueTime,
        duration_minutes: duration ? parseInt(duration) : undefined,
        reminder_minutes: parseInt(reminderMinutes),
      });

      // Only reset/close after creation succeeded
      if (created) {
        speakTaskCreated(trimmedTitle);
        toast({ title: "Task locked in.", description: `"${trimmedTitle}" added. Now follow through.` });

        resetForm();
        setOpen(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full glass-card p-4 flex items-center justify-center gap-3 text-primary hover:border-primary/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-medium">Add Task Manually</span>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finish project report"
              className="bg-secondary/50"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Due Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Due Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-mint" />
                Duration (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder" className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-warning" />
                Reminder *
              </Label>
              <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select when to remind you" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.filter(opt => opt.value !== "").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful"
              disabled={isSubmitting}
            >
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
