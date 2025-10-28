# User Management & Troubleshooting Guide

## ✅ Fixes Applied

### 1. User Deletion Fixed
- Added DELETE policy for users to delete their own profile
- Added service role policy for admin deletions
- Created `delete_user_account()` function for complete user deletion
- Created `admin_delete_user()` function for admin operations

### 2. Email Issues Explained

## 📧 Why Emails Aren't Sending

Supabase free tier has strict email limits:
- **4 emails per hour** maximum
- Emails can be delayed or blocked
- Default email service is unreliable for production

### Quick Fixes:

#### Option A: Manually Verify Users (Development)
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user
3. Click **⋮** menu → **Send magic link** or manually verify

#### Option B: Disable Email Confirmation (Development Only)
1. **Authentication** → **Settings** → **Email Auth**
2. Toggle **"Confirm email"** to **OFF**
3. Users can log in immediately without confirmation
⚠️ **Not recommended for production!**

#### Option C: Configure Custom SMTP (Production)
1. **Authentication** → **Settings** → **SMTP Settings**
2. Configure with:
   - **SendGrid** (free tier: 100 emails/day)
   - **Resend** (free tier: 100 emails/day)
   - **AWS SES** (cheap, reliable)
   - **Mailgun**, **Postmark**, etc.

## 🗑️ How to Properly Delete Users

### Method 1: Via Supabase Dashboard (Easiest)
1. Go to **Authentication** → **Users**
2. Find the user
3. Click **⋮** → **Delete user**
4. ✅ This deletes from both `auth.users` AND cascades to `profiles`

### Method 2: Via SQL (Complete control)
```sql
-- Find user by email
SELECT id, email, created_at FROM auth.users 
WHERE email = 'user@example.com';

-- Delete user (cascades to profiles, messages, badges, etc.)
DELETE FROM auth.users WHERE email = 'user@example.com';

-- Or by ID
DELETE FROM auth.users WHERE id = 'uuid-here';
```

### Method 3: Via New Function (After running migration)
```sql
-- For admins to delete any user (run as service role)
SELECT admin_delete_user('user-uuid-here');

-- For users to delete their own account (from app)
SELECT delete_user_account();
```

## 📝 Apply the Fixes

### Step 1: Run the Migration
Copy and paste this SQL in **Supabase SQL Editor**:

```sql
-- Paste contents of supabase/migrations/20251028000001_fix_user_deletion.sql
```

### Step 2: Delete Friend's Account
```sql
-- Replace with their actual email
DELETE FROM auth.users WHERE email = 'friends-email@example.com';
```

### Step 3: Configure SMTP (Optional, for production)
1. Sign up for SendGrid free tier
2. Get API key
3. Add to Supabase SMTP settings

## 🔍 Verify Everything Works

### Test Deletion:
1. Create a test account
2. Delete it via dashboard
3. Try to log in → Should fail

### Test Email:
1. Sign up with new email
2. Check inbox (and spam folder)
3. If no email after 5 minutes → SMTP not configured

## 🚨 Common Issues

### "User can still log in after deletion"
- You only deleted from `profiles`, not `auth.users`
- Solution: Use dashboard or SQL to delete from `auth.users`

### "No confirmation email received"
- Rate limit hit (4 emails/hour)
- Email went to spam folder
- SMTP not configured
- Solution: Manually verify or configure custom SMTP

### "Cannot delete user - permission denied"
- RLS blocking deletion
- Solution: Run the migration to add DELETE policies

## 📊 Current Setup

**Email Confirmation:** ✅ ON (from your screenshot)
**Rate Limit:** 4 emails/hour (Supabase default)
**SMTP:** Not configured (using Supabase default)
**Delete Policies:** ❌ Missing (fixed by migration)

## Next Steps

1. ✅ Run the migration: `20251028000001_fix_user_deletion.sql`
2. ✅ Delete friend's account: `DELETE FROM auth.users WHERE email = '...'`
3. ⚠️ Configure SMTP for reliable emails (optional but recommended)
4. ✅ Test: Create account → Delete → Verify it's gone
