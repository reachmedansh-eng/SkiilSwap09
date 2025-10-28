-- Function to properly delete a user (auth + profile)
create or replace function delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete from auth.users (will cascade to profiles and related data)
  delete from auth.users where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users (for self-deletion)
grant execute on function delete_user(uuid) to authenticated;

comment on function delete_user is 'Deletes a user from auth.users (cascades to profiles and all related data)';
