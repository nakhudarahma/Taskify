
-- Add completion tracking columns to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reopened BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reopen_cooldown_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;
