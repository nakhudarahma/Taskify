import { useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/hooks/useTasks';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { getPersonalityMessage } from '@/lib/personalityMessages';

export const useTaskExpiration = (
  tasks: Task[],
  onTaskExpired: (id: string) => Promise<boolean>,
  onRefresh: () => void
) => {
  const { profile, updateProfile } = useAuth();
  const { speakCustom, isEnabled } = useVoiceFeedback();

  const checkExpiredTasks = useCallback(async () => {
    const now = new Date();
    const personality = profile?.ai_personality;

    for (const task of tasks) {
      if (task.status === 'completed' || !task.due_date || !task.due_time) continue;

      const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);

      if (now > dueDateTime) {
        // Task has expired - delete it permanently
        const deleted = await onTaskExpired(task.id);

        if (deleted) {
          // Reset streak
          if (profile) {
            await updateProfile({ streak_count: 0 });
          }

          if (isEnabled) {
            const msg = getPersonalityMessage(personality, 'taskExpired', { taskName: task.title });

            // Debug safety check
            if (import.meta.env.DEV) {
              console.log('[AI Debug] taskExpired raw AI response:', msg);
            }

            speakCustom(msg);
          }
        }
      }
    }
  }, [tasks, profile, onTaskExpired, speakCustom, isEnabled]);

  // Check every 60 seconds for expired tasks
  useEffect(() => {
    checkExpiredTasks();
    const interval = setInterval(checkExpiredTasks, 60000);
    return () => clearInterval(interval);
  }, [checkExpiredTasks]);
};
