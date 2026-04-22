import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, CheckSquare, Mic } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskCard from "@/components/TaskCard";
import EditTaskDialog from "@/components/EditTaskDialog";
import CompletionConfirmDialog from "@/components/CompletionConfirmDialog";
import ReopenTaskDialog from "@/components/ReopenTaskDialog";
import { ReopenReason } from "@/components/ReopenTaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { getPersonalityMessage } from "@/lib/personalityMessages";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";


const COOLDOWN_MINUTES = 5;

const Tasks = () => {
  const { tasks, loading, createTask, updateTask, toggleTaskStatus, deleteTask, pendingTasks, completedTasks } = useTasks();
  const { profile, updateProfile } = useAuth();
  const { speakCustom, speakTaskCreated, speakTaskDeleted } = useVoiceFeedback();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", date: "", time: "", duration: "" });

  const personality = profile?.ai_personality;

  // Completion confirmation state
  const [completionTarget, setCompletionTarget] = useState<Task | null>(null);
  const [completionMessage, setCompletionMessage] = useState("");

  // Reopen state
  const [reopenTarget, setReopenTarget] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || (filterStatus === "completed" && task.status === 'completed') || (filterStatus === "pending" && task.status === 'pending');
    return matchesSearch && matchesFilter;
  });

  const handleAddTask = async () => {
    if (!newTask.title) return;
    const result = await createTask({
      title: newTask.title,
      due_date: newTask.date || undefined,
      due_time: newTask.time || undefined,
      duration_minutes: newTask.duration ? parseInt(newTask.duration) : undefined,
    });
    if (result) {
      speakTaskCreated(newTask.title);
    }
    setNewTask({ title: "", date: "", time: "", duration: "" });
    setIsAddDialogOpen(false);
  };

  const handleRequestComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const msg = `Are you sure you want to complete "${task.title}"?`;
    setCompletionMessage(msg);
    setCompletionTarget(task);
  };

  const handleConfirmComplete = async () => {
    if (!completionTarget) return;
    const task = completionTarget;
    setCompletionTarget(null);

    const success = await updateTask(task.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as any);

    if (success) {
      const aiMessage = `Task "${task.title}" completed.`;
      speakCustom(aiMessage);

      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const lastStreakDate = profile?.last_streak_date;
        const currentStreak = profile?.streak_count || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        let newStreak = 1;
        if (lastStreakDate === yesterdayStr || lastStreakDate === today) {
          newStreak = currentStreak + (lastStreakDate === today ? 0 : 1);
        }
        await updateProfile({ streak_count: newStreak, last_streak_date: today });
      }
    }
  };

  const handleRequestReopen = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) setReopenTarget(task);
  };

  const handleConfirmReopen = async (reason: ReopenReason) => {
    if (!reopenTarget) return;
    const task = reopenTarget;
    setReopenTarget(null);

    const cooldownUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000).toISOString();

    const success = await updateTask(task.id, {
      status: 'pending',
      reopened: true,
      completed_at: null,
      reopen_cooldown_until: cooldownUntil,
    } as any);

    if (success) {
      if (profile) {
        const currentStreak = profile?.streak_count || 0;
        const newStreak = Math.max(0, currentStreak - 1);
        await updateProfile({ streak_count: newStreak });
      }

      const aiMessage = `Task "${task.title}" reopened.`;
      speakCustom(aiMessage);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const success = await deleteTask(id);
    if (success) {
      speakTaskDeleted(task.title);
    }
  };

  const handleEditTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) setEditingTask(task);
  };

  const handleSaveEdit = async (id: string, updates: { title: string; due_date?: string; due_time?: string; duration_minutes?: number; reminder_minutes?: number }) => {
    return await updateTask(id, {
      title: updates.title,
      due_date: updates.due_date || null,
      due_time: updates.due_time || null,
      duration_minutes: updates.duration_minutes || null,
      reminder_minutes: updates.reminder_minutes || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">{pendingTasks.length} pending, {completedTasks.length} completed</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/85 gap-2 btn-cheerful"><Plus className="w-4 h-4" />Add Task</Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Task Name</Label><Input placeholder="Enter task name" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-secondary/50" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })} className="bg-secondary/50" /></div>
                  <div className="space-y-2"><Label>Time</Label><Input type="time" value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} className="bg-secondary/50" /></div>
                </div>
                <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" placeholder="e.g., 60" value={newTask.duration} onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })} className="bg-secondary/50" /></div>
                <Button onClick={handleAddTask} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful">Save Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Tasks</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleRequestComplete(task.id)}
                  onReopen={() => handleRequestReopen(task.id)}
                  onEdit={() => handleEditTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </AnimatePresence>
          )}

          {!loading && filteredTasks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                {searchQuery ? <CheckSquare className="w-8 h-8 text-muted-foreground" /> : <Mic className="w-8 h-8 text-primary" />}
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">{searchQuery ? "No tasks found" : "No tasks yet!"}</h3>
              <p className="text-muted-foreground mb-4">{searchQuery ? "Try a different search" : "Create your first task to get started"}</p>
              {!searchQuery && <Link to="/dashboard"><Button className="bg-primary text-primary-foreground hover:bg-primary/85 gap-2 btn-cheerful"><Mic className="w-4 h-4" />Use Voice</Button></Link>}
            </motion.div>
          )}
        </div>

        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSave={handleSaveEdit}
        />

        {/* Completion Confirmation Dialog */}
        <CompletionConfirmDialog
          open={!!completionTarget}
          onOpenChange={(open) => !open && setCompletionTarget(null)}
          onConfirm={handleConfirmComplete}
          confirmationMessage={completionMessage}
          taskTitle={completionTarget?.title || ""}
        />

        {/* Reopen Task Dialog */}
        <ReopenTaskDialog
          open={!!reopenTarget}
          onOpenChange={(open) => !open && setReopenTarget(null)}
          onConfirm={handleConfirmReopen}
          taskTitle={reopenTarget?.title || ""}
        />
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
