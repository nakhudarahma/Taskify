
-- Add AI personality and streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date DATE DEFAULT NULL;
