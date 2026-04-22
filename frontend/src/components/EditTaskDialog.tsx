import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Timer, Bell } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { title: string; due_date?: string; due_time?: string; duration_minutes?: number; reminder_minutes?: number }) => Promise<boolean>;
}

const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

const EditTaskDialog = ({ task, open, onOpenChange, onSave }: EditTaskDialogProps) => {
  const { speakTaskUpdated } = useVoiceFeedback();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.due_date || "");
      setTime(task.due_time || "");
      setDuration(task.duration_minutes?.toString() || "");
      // Handle reminder_minutes - it might not exist on old tasks
      const taskWithReminder = task as Task & { reminder_minutes?: number };
      setReminderMinutes(taskWithReminder.reminder_minutes?.toString() || "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    
    setSaving(true);
    const success = await onSave(task.id, {
      title: title.trim(),
      due_date: date || undefined,
      due_time: time || undefined,
      duration_minutes: duration ? parseInt(duration) : undefined,
      reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : undefined,
    });
    setSaving(false);
    
    if (success) {
      speakTaskUpdated(title.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Task Name</Label>
            <Input
              placeholder="Enter task name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Due Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Due Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-mint" />
                Duration (min)
              </Label>
              <Input
                type="number"
                placeholder="e.g., 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-warning" />
                Reminder
              </Label>
              <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select reminder" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value || "none"} value={option.value || "none"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
