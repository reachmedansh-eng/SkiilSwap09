-- Debug Chat Widget Issues
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if profiles exist
SELECT 
  id, 
  username, 
  email,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if messages table exists and has data
SELECT 
  m.id,
  m.sender_id,
  m.receiver_id,
  m.content,
  m.read,
  m.created_at,
  sender.username as sender_username,
  receiver.username as receiver_username
FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN profiles receiver ON m.receiver_id = receiver.id
ORDER BY m.created_at DESC
LIMIT 20;

-- 3. Check messages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'messages';

-- 5. Check policies on messages table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages';

-- 6. Test insert (replace UUIDs with actual user IDs from step 1)
-- First, get two user IDs:
SELECT id, username FROM profiles LIMIT 2;

-- Then test insert (replace the UUIDs below):
-- INSERT INTO messages (sender_id, receiver_id, content)
-- VALUES (
--   'sender-uuid-here',
--   'receiver-uuid-here',
--   'Test message from SQL'
-- );

-- 7. Check if foreign keys are working
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'messages' AND tc.constraint_type = 'FOREIGN KEY';
