-- Add credits column to profiles for persistent credit tracking
alter table if exists public.profiles
  add column if not exists credits numeric not null default 10;

-- Optional: ensure no nulls and set default for existing rows
update public.profiles set credits = 10 where credits is null;
