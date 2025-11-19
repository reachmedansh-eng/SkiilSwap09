-- Ensure unique usernames and emails in profiles (case-insensitive)
create unique index if not exists profiles_username_unique on public.profiles (lower(username));
create unique index if not exists profiles_email_unique on public.profiles (lower(email));
