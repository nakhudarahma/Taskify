-- Add reminder_minutes column to tasks table for per-task reminders
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN public.tasks.reminder_minutes IS 'Minutes before due time to send reminder. NULL means no reminder set.';