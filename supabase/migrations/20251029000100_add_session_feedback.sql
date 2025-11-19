-- Add post-session feedback fields
alter table public.sessions
	add column if not exists satisfied boolean,
	add column if not exists feedback text;

-- Optional helper index if you query by satisfied
create index if not exists sessions_satisfied_idx on public.sessions(satisfied);
