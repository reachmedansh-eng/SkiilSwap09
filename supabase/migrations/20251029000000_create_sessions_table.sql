    -- Create sessions table for scheduled meetings
    create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    exchange_id uuid references public.exchanges(id) on delete cascade,
    mentor_id uuid references public.profiles(id) on delete cascade not null,
    mentee_id uuid references public.profiles(id) on delete cascade not null,
    link text not null,
    scheduled_at timestamptz not null,
    status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
    created_at timestamptz not null default now()
    );

    alter table public.sessions enable row level security;

    -- Participants can view their sessions
    drop policy if exists "participants can view sessions" on public.sessions;
    create policy "participants can view sessions"
    on public.sessions for select
    using (auth.uid() = mentor_id or auth.uid() = mentee_id);

    -- Participants can insert sessions
    drop policy if exists "participants can insert sessions" on public.sessions;
    create policy "participants can insert sessions"
    on public.sessions for insert
    with check (auth.uid() = mentor_id or auth.uid() = mentee_id);

    -- Participants can update their sessions (reschedule/cancel)
    drop policy if exists "participants can update sessions" on public.sessions;
    create policy "participants can update sessions"
    on public.sessions for update
    using (auth.uid() = mentor_id or auth.uid() = mentee_id);

    -- Optional: allow delete by participants
    drop policy if exists "participants can delete sessions" on public.sessions;
    create policy "participants can delete sessions"
    on public.sessions for delete
    using (auth.uid() = mentor_id or auth.uid() = mentee_id);

    -- Indexes
    create index if not exists sessions_mentor_id_idx on public.sessions(mentor_id);
    create index if not exists sessions_mentee_id_idx on public.sessions(mentee_id);
    create index if not exists sessions_scheduled_at_idx on public.sessions(scheduled_at);
