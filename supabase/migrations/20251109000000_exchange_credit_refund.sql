-- Migration: add credit refund tracking to exchanges and refund function
alter table if exists public.exchanges
  add column if not exists credit_refunded boolean not null default false;

-- Function: refund_exchange_credit
-- Allows the provider of a pending exchange to cancel and automatically refund
-- 1 credit to the requester exactly once.
create or replace function public.refund_exchange_credit(p_exchange_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_requester uuid;
  v_provider uuid;
  v_status text;
  v_refunded boolean;
begin
  select requester_id, provider_id, status, credit_refunded
    into v_requester, v_provider, v_status, v_refunded
  from public.exchanges
  where id = p_exchange_id
  for update;

  if not found then
    return false; -- exchange missing
  end if;

  -- Ensure caller is provider (auth user) and exchange is still pending and not yet refunded
  if v_provider != auth.uid() or v_status != 'pending' or v_refunded then
    return false; -- not allowed or already processed
  end if;

  -- Mark cancelled & refunded atomically
  update public.exchanges
     set status = 'cancelled', credit_refunded = true, updated_at = now()
   where id = p_exchange_id;

  -- Refund exactly 1 credit to requester
  update public.profiles
     set credits = credits + 1
   where id = v_requester;

  return true;
end;
$$;

comment on function public.refund_exchange_credit(uuid) is 'Cancels a pending exchange (by provider) and refunds 1 credit to the requester once.';
