import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, Calendar, TrendingUp, Mic, Flame } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import VoiceInput from "@/components/VoiceInput";
import AddTaskDialog from "@/components/AddTaskDialog";
import TaskCard from "@/components/TaskCard";
import EditTaskDialog from "@/components/EditTaskDialog";
import CompletionConfirmDialog from "@/components/CompletionConfirmDialog";
import ReopenTaskDialog from "@/components/ReopenTaskDialog";
import { ReopenReason } from "@/components/ReopenTaskDialog";
import { useTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { getPersonalityMessage } from "@/lib/personalityMessages";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { useTaskExpiration } from "@/hooks/useTaskExpiration";

import { Skeleton } from "@/components/ui/skeleton";

const COOLDOWN_MINUTES = 5;

const Dashboard = () => {

  /* Fixed: Use centralized personality messages */
  const { profile, updateProfile } = useAuth();
  const { tasks, loading, createTask, updateTask, toggleTaskStatus, deleteTask, pendingTasks, completedTasks, todayTasks, refreshTasks } = useTasks();
  const { speakCustom, isEnabled } = useVoiceFeedback();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Completion confirmation state
  const [completionTarget, setCompletionTarget] = useState<Task | null>(null);
  const [completionMessage, setCompletionMessage] = useState("");

  // Reopen state
  const [reopenTarget, setReopenTarget] = useState<Task | null>(null);

  const personality = profile?.ai_personality;
  const streakCount = profile?.streak_count || 0;

  // Safe Arrays (Minimal Fix)
  const safeTasks = tasks || [];
  const safePending = pendingTasks || [];
  const safeCompleted = completedTasks || [];

  // FIXED: Call useTaskExpiration UNCONDITIONALLY (moved outside conditional)
  // This hook is always called in the same order to comply with Rules of Hooks
  useTaskExpiration(safeTasks, deleteTask, refreshTasks);

  if (!profile && loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-48" />
        </div>
      </DashboardLayout>
    );
  }


  const handleTaskCreated = async (taskData: { title: string; due_date?: string; due_time?: string; duration_minutes?: number; reminder_minutes?: number }) => {
    const created = await createTask(taskData);
    if (!created) {
      throw new Error("Failed to create task");
    }

    // Strict Personality Voice Feedback (Centralized)
    const phrase = getPersonalityMessage(personality, 'taskCreated', taskData.title);
    if (speakCustom) speakCustom(phrase);

    return created;
  };

  const handleEditTask = (id: string) => {
    const task = safeTasks.find(t => t.id === id);
    if (task) setEditingTask(task);
  };

  // New: Open completion confirmation dialog
  const handleRequestComplete = (id: string) => {
    const task = safeTasks.find(t => t.id === id);
    if (!task) return;

    // Use completion confirmation message from personality
    const msg = getPersonalityMessage(personality, 'completionConfirm', task.title);

    setCompletionMessage(msg);
    setCompletionTarget(task);
  };

  // New: Confirm completion
  const handleConfirmComplete = async () => {
    if (!completionTarget) return;
    const task = completionTarget;
    setCompletionTarget(null);

    const success = await updateTask(task.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as any);

    if (success) {
      // Calculate context for aggressive AI
      const today = new Date().toDateString();
      const todayCompletedCount = safeTasks.filter(t =>
        t.status === 'completed' &&
        t.completed_at &&
        new Date(t.completed_at).toDateString() === today
      ).length + 1; // +1 includes the current one

      const aiMessage = getPersonalityMessage(personality, 'taskCompleted', {
        taskName: task.title,
        todayCompletedCount
      });

      if (import.meta.env.DEV) {
        console.log('[AI Debug] taskCompleted raw AI response:', aiMessage);
      }

      // VISUAL CONFIRMATION + VOICE
      toast({
        title: "Task Completed",
        description: aiMessage,
        duration: 5000,
      });

      // FIXED: Guard against undefined speakCustom
      if (speakCustom && aiMessage) {
        speakCustom(aiMessage);
      }


      // Update streak
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

  // New: Request reopen
  const handleRequestReopen = (id: string) => {
    const task = safeTasks.find(t => t.id === id);
    if (task) setReopenTarget(task);
  };

  // New: Confirm reopen with reason
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
      // Reduce streak
      if (profile) {
        const currentStreak = profile?.streak_count || 0;
        const newStreak = Math.max(0, currentStreak - 1);
        await updateProfile({ streak_count: newStreak });
      }

      const aiMessage = getPersonalityMessage(personality, 'taskReopened', { taskName: task.title });
      if (import.meta.env.DEV) {
        console.log('[AI Debug] taskReopened raw AI response:', aiMessage);
      }
      // FIXED: Guard against undefined speakCustom
      if (speakCustom && aiMessage) {
        speakCustom(aiMessage);
      }

    }
  };

  const handleDeleteTask = async (id: string) => {
    const task = safeTasks.find(t => t.id === id);
    if (!task) return;

    const success = await deleteTask(id);
    if (success) {
      const aiMessage = getPersonalityMessage(personality, 'taskDeleted', { taskName: task.title });
      if (import.meta.env.DEV) {
        console.log('[AI Debug] taskDeleted raw AI response:', aiMessage);
      }
      // FIXED: Guard against undefined speakCustom
      if (speakCustom && aiMessage) {
        speakCustom(aiMessage);
      }

    }
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
  const displayName = profile?.name || profile?.display_name || 'there';

  const stats = [
    { label: "Total Tasks", value: safeTasks.length, icon: CheckSquare, color: "bg-primary/10 text-primary" },
    { label: "Completed", value: safeCompleted.length, icon: TrendingUp, color: "bg-success/10 text-success" },
    { label: "Pending", value: safePending.length, icon: Clock, color: "bg-warning/10 text-warning" },
    { label: "Streak", value: streakCount, icon: Flame, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Welcome, {displayName}.</h1>
          <p className="text-muted-foreground">
            {safePending.length > 0
              ? `You have ${safePending.length} pending ${safePending.length === 1 ? 'task' : 'tasks'}.`
              : "You have no pending tasks."}
          </p>
          <p className="text-muted-foreground mt-1 font-medium italic">
            "{getPersonalityMessage(personality, 'sarcasticGreeting', { userName: displayName })}"
          </p>
        </motion.div>

        {/* Voice Input */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Add Task</h2>
          <div className="space-y-4">
            <VoiceInput onTaskCreated={handleTaskCreated} />
            <AddTaskDialog onTaskCreated={handleTaskCreated} />
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass-card p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Tasks */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Tasks</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : safeTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">No tasks yet.</h3>
              <p className="text-muted-foreground">Click the microphone to add one.</p>

            </motion.div>
          ) : (
            <div className="space-y-3">
              {safeTasks.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleRequestComplete(task.id)}
                  onReopen={() => handleRequestReopen(task.id)}
                  onEdit={() => handleEditTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>

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
    </DashboardLayout >
  );
};

export default Dashboard;