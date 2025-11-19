-- Quick verification: Check if sessions table exists and has the right columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sessions'
ORDER BY ordinal_position;

-- Also check if any sessions exist
SELECT COUNT(*) as session_count FROM public.sessions;

-- Check RLS policies on sessions
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'sessions';
