# Chat Widget Troubleshooting Guide

## 🔍 Quick Diagnosis

### Step 1: Open Browser Console
1. Press **F12** (or Right-click → Inspect)
2. Go to **Console** tab
3. Refresh the page
4. Look for these messages:

```
✅ "Fetched users: [...]" - Shows list of available users
✅ "Fetched messages: [...]" - Shows messages when you click a user
❌ "Error fetching users: ..." - Users query failed
❌ "Error fetching messages: ..." - Messages query failed
```

### Step 2: Check Database
Run `DEBUG_CHAT.sql` in **Supabase SQL Editor** to check:
- ✅ Profiles exist
- ✅ Messages table exists
- ✅ RLS policies are correct
- ✅ Foreign keys work

## 🐛 Common Issues

### Issue 1: "No users available to chat"

**Cause:** No other users in the database

**Fix:** Create test users:
1. Sign out
2. Create new account with different email
3. Sign back in with original account
4. Chat widget should now show the new user

### Issue 2: Messages not showing after sending

**Cause 1:** Messages saving but not fetching

**Check console for:**
```
✅ "Message sent: [...]" - Message was saved
❌ "Fetched messages: []" - Empty array means query issue
```

**Fix:**
- Check if `sender` relationship works (foreign key issue)
- Run query 2 from `DEBUG_CHAT.sql` to see raw messages

**Cause 2:** Real-time subscription not working

**Fix:** Check if Realtime is enabled:
1. **Supabase Dashboard** → **Database** → **Replication**
2. Find `messages` table
3. Toggle **ON**

### Issue 3: "Error sending message"

**Cause:** RLS policy blocking insert or foreign key failing

**Check console error for:**
- `"permission denied"` → RLS policy issue
- `"violates foreign key constraint"` → sender_id/receiver_id doesn't exist in profiles

**Fix RLS:**
```sql
-- Check current user ID
SELECT auth.uid();

-- Check if you exist in profiles
SELECT * FROM profiles WHERE id = auth.uid();
```

If no profile exists → Profile wasn't created during signup

**Create profile manually:**
```sql
INSERT INTO profiles (id, email, username)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'your-username'
);
```

### Issue 4: Messages send but don't appear until refresh

**Cause:** Real-time subscription not working

**Fix:**
1. Enable Realtime in Supabase Dashboard
2. Check browser console for WebSocket errors
3. Verify real-time subscription code is running

## 🧪 Test Manually

### Create Test Message in SQL
```sql
-- Get your user ID
SELECT id, username FROM profiles WHERE email = 'your-email@example.com';

-- Get another user ID
SELECT id, username FROM profiles WHERE email != 'your-email@example.com' LIMIT 1;

-- Insert test message (replace UUIDs)
INSERT INTO messages (sender_id, receiver_id, content, read)
VALUES (
  'your-user-uuid',
  'other-user-uuid',
  'Test message from SQL',
  false
);

-- Verify it was inserted
SELECT 
  m.*,
  sender.username as sender_name,
  receiver.username as receiver_name
FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN profiles receiver ON m.receiver_id = receiver.id
ORDER BY created_at DESC
LIMIT 5;
```

### Check Chat Widget
1. Refresh page
2. Open chat widget
3. Click on the other user
4. You should see "Test message from SQL"

## 🔧 Enable Realtime (If Not Working)

### In Supabase Dashboard:
1. **Database** → **Replication**
2. Find `messages` table
3. Toggle **ON** (should be green)
4. Click **Save**

### Verify in Console:
You should see WebSocket connection logs when opening chat:
```
[Realtime] Connected
[Realtime] Subscribed to channel: messages:uuid:uuid
```

## 📊 What Should Happen

### Normal Flow:
1. ✅ Page loads → Fetches users list
2. ✅ Click user → Fetches messages with that user
3. ✅ Type message → Sends to database
4. ✅ Real-time listener → Updates UI instantly
5. ✅ Other user refreshes → Sees new message

### Current Issue:
Based on your description, messages are probably:
- ✅ Saving to database
- ❌ Not showing in UI after sending
- ❌ Not loading when selecting user

Most likely causes:
1. Foreign key query failing (sender relationship)
2. Real-time not enabled
3. Profiles missing for one/both users

## 🚀 Quick Fix Checklist

- [ ] Run `DEBUG_CHAT.sql` queries 1-5
- [ ] Check browser console for errors
- [ ] Verify at least 2 profiles exist
- [ ] Verify messages exist in database
- [ ] Enable Realtime for messages table
- [ ] Test sending message (check console logs)
- [ ] Refresh page and try again

## 📞 Report Back

After running the debug queries, tell me:
1. How many profiles exist?
2. How many messages exist?
3. What errors appear in console?
4. Is Realtime enabled for messages table?

I'll help you fix the specific issue!
