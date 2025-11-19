-- Function to award XP to both users when a session is completed
create or replace function award_session_xp(
  p_exchange_id uuid,
  p_session_number integer
)
returns boolean as $$
declare
  v_requester_id uuid;
  v_provider_id uuid;
  v_xp_amount integer := 50; -- Base XP per session
begin
  -- Get the users involved in the exchange
  select requester_id, provider_id
  into v_requester_id, v_provider_id
  from exchanges
  where id = p_exchange_id;

  if v_requester_id is null or v_provider_id is null then
    return false;
  end if;

  -- Award XP to both users
  update profiles
  set xp = xp + v_xp_amount
  where id = v_requester_id;

  update profiles
  set xp = xp + v_xp_amount
  where id = v_provider_id;

  return true;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function award_session_xp(uuid, integer) to authenticated;
