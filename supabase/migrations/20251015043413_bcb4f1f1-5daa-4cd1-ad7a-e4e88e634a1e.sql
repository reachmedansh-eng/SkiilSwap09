-- Create users profile table with gamification
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  avatar_url text,
  bio text,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak_count integer default 0 not null,
  last_login timestamp with time zone default now(),
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create courses table
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  thumbnail_url text,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  rating decimal default 0,
  total_students integer default 0,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.courses enable row level security;

-- Courses policies
create policy "Courses are viewable by everyone"
  on public.courses for select
  using (true);

create policy "Instructors can create courses"
  on public.courses for insert
  with check (auth.uid() = instructor_id);

create policy "Instructors can update own courses"
  on public.courses for update
  using (auth.uid() = instructor_id);

-- Create lessons table
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  video_url text,
  duration integer default 0,
  order_index integer not null,
  content text,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.lessons enable row level security;

-- Lessons policies
create policy "Lessons are viewable by everyone"
  on public.lessons for select
  using (true);

create policy "Course instructors can manage lessons"
  on public.lessons for all
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id
      and courses.instructor_id = auth.uid()
    )
  );

-- Create enrollments table
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  completed_lessons jsonb default '[]'::jsonb,
  enrolled_at timestamp with time zone default now() not null,
  unique(user_id, course_id)
);

-- Enable RLS
alter table public.enrollments enable row level security;

-- Enrollments policies
create policy "Users can view own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Users can create own enrollments"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own enrollments"
  on public.enrollments for update
  using (auth.uid() = user_id);

-- Create messages table for chat
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  file_url text,
  read boolean default false,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Messages policies
create policy "Users can view messages they sent or received"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update messages they received"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Create badges table
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_type text not null,
  name text not null,
  description text,
  icon text,
  earned_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.badges enable row level security;

-- Badges policies
create policy "Badges are viewable by everyone"
  on public.badges for select
  using (true);

create policy "System can create badges"
  on public.badges for insert
  with check (true);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_streak_on_login()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  days_since_last_login integer;
begin
  if old.last_login is not null then
    days_since_last_login := extract(day from (new.last_login - old.last_login));
    
    if days_since_last_login = 1 then
      -- Continue streak
      new.streak_count := old.streak_count + 1;
    elsif days_since_last_login > 1 then
      -- Reset streak
      new.streak_count := 1;
    end if;
  end if;
  
  return new;
end;
$$;

-- Trigger to update streak on login
create trigger on_user_login
  before update of last_login on public.profiles
  for each row execute procedure public.update_streak_on_login();