-- ============================================================
-- 002_add_username.sql
-- Adds unique username column to profiles table
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
