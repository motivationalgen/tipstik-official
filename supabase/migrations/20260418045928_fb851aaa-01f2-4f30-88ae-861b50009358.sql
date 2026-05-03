-- Create match_tier enum
CREATE TYPE public.match_tier AS ENUM ('free', 'members', 'pro', 'vip');

-- Add tier column to matches
ALTER TABLE public.matches
  ADD COLUMN tier public.match_tier NOT NULL DEFAULT 'members';

-- Extend app_role enum with new role values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vip';