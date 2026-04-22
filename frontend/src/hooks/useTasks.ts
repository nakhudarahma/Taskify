import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  duration_minutes: number | null;
  reminder_minutes: number | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  reopened?: boolean;
  reopen_cooldown_until?: string | null;
}

export interface CreateTaskInput {
  title: string;
  due_date?: string;
  due_time?: string;
  reminder_minutes?: number;
  duration_minutes?: number;
}


export const useTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tasks',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput): Promise<Task | null> => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create tasks',
      });
      return null;
    }

    try {
      // Reverted to title as per backend schema (backend/models/schemas.py)
      const payload = {
        title: input.title,
        due_date: input.due_date,
        due_time: input.due_time,
        reminder_time: input.reminder_minutes,
        duration_minutes: input.duration_minutes
      };

      console.log('🚀 Debug: Creating task with payload for backend:', payload);

      const data = await api.post('/tasks/create', payload);
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMessage = error.message || 'Failed to create task';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      if (updates.status === 'completed' && updates.completed_at) {
        // Special handling for completion to trigger voice feedback from backend
        const response = await api.put(`/tasks/${id}/complete`, {}); // The backend endpoint handles the status update
        if (response.status === 'success') {
          // We can optionally use response.voice_feedback here if needed
        }
      } else {
        await api.patch(`/tasks/${id}`, updates);
      }

      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task',
      });
      return false;
    }
  };

  const toggleTaskStatus = async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return updateTask(id, { status: newStatus });
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task',
      });
      return false;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const todayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.due_date === today;
  });

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    refreshTasks: fetchTasks,
    pendingTasks,
    completedTasks,
    todayTasks,
  };
};
