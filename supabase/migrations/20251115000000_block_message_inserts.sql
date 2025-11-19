-- Strengthen existing insert policy by adding block condition.
-- We drop the original permissive insert policy and recreate it
-- with a NOT EXISTS check against blocked_users. Policies are OR-composed,
-- so the block logic must live inside the allowing policy.
drop policy if exists "Users can send messages" on public.messages;

create policy "Users can send messages"
on public.messages for insert
with check (
  auth.uid() = sender_id
  and not exists (
    select 1
    from public.blocked_users b
    where (
      (b.blocker_id = auth.uid() and b.blocked_id = receiver_id) or
      (b.blocked_id = auth.uid() and b.blocker_id = receiver_id)
    )
  )
);

-- Restore the original SELECT policy so users can see message history
drop policy if exists "Users can view messages they sent or received" on public.messages;

create policy "Users can view messages they sent or received"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);
