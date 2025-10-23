-- Storage bucket for avatars (if not exists)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Create messages table for chat functionality
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  exchange_id uuid references public.exchanges(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Messages policies
create policy "Users can view messages they sent or received"
  on public.messages for select
  using (auth.uid() = sender_id OR auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update messages they received (mark as read)"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Create badges table if not exists
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_type text not null,
  name text not null,
  icon text,
  description text,
  earned_at timestamp with time zone default now() not null
);

-- Enable RLS on badges
alter table public.badges enable row level security;

-- Badges policies
create policy "Badges are viewable by everyone"
  on public.badges for select
  using (true);

create policy "System can insert badges"
  on public.badges for insert
  with check (true);

-- Add index for faster message queries
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_exchange_id_idx on public.messages(exchange_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- Add index for badges
create index if not exists badges_user_id_idx on public.badges(user_id);

-- Function to update last_login and calculate streaks
create or replace function update_user_streak()
returns trigger as $$
declare
  last_login_date date;
  current_date date := now()::date;
begin
  last_login_date := NEW.last_login::date;
  
  -- If last login was yesterday, increment streak
  if last_login_date = current_date - interval '1 day' then
    NEW.streak_count := OLD.streak_count + 1;
  -- If last login was today, keep streak
  elsif last_login_date = current_date then
    NEW.streak_count := OLD.streak_count;
  -- Otherwise reset streak to 1
  else
    NEW.streak_count := 1;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger for streak calculation
drop trigger if exists on_profile_login on public.profiles;
create trigger on_profile_login
  before update of last_login on public.profiles
  for each row
  execute function update_user_streak();

-- Function to calculate level from XP
create or replace function calculate_level(xp_amount integer)
returns integer as $$
begin
  -- Simple formula: level = floor(sqrt(xp / 100)) + 1
  -- Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
  return floor(sqrt(xp_amount / 100.0)) + 1;
end;
$$ language plpgsql immutable;

-- Trigger to auto-update level when XP changes
create or replace function update_user_level()
returns trigger as $$
begin
  NEW.level := calculate_level(NEW.xp);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_xp_change on public.profiles;
create trigger on_xp_change
  before insert or update of xp on public.profiles
  for each row
  execute function update_user_level();
