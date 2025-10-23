# 🚀 Deployment Checklist

## ✅ Pre-Deployment Tasks

### 1. Database Setup
- [ ] All migrations applied to Supabase
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket `avatars` created and public
- [ ] Storage policies configured
- [ ] Test database connection from local app

### 2. Environment Variables
- [ ] `.env` file configured locally (not committed to git)
- [ ] Environment variables added to deployment platform
- [ ] Supabase URL and keys are correct
- [ ] Keys are valid and not expired

### 3. Code Quality
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Test all major features locally
- [ ] Check console for errors
- [ ] Remove any console.logs in production code

### 4. Testing Checklist

#### Authentication
- [ ] Sign up with new user works
- [ ] Email verification flow works
- [ ] Login with existing user works
- [ ] Logout works
- [ ] Protected routes redirect to /auth

#### Profile Features
- [ ] Profile creation after signup
- [ ] Avatar upload works
- [ ] Profile update saves correctly
- [ ] Username changes persist
- [ ] Bio updates work

#### Skill Listings
- [ ] Create new listing works
- [ ] View all listings
- [ ] Filter/search listings
- [ ] Delete own listings

#### Exchanges
- [ ] Propose swap creates exchange
- [ ] Accept/decline requests in Inbox
- [ ] Active exchanges show correctly
- [ ] Complete session updates progress
- [ ] Abandon exchange with refund

#### Messaging
- [ ] Send message works
- [ ] Receive messages in real-time
- [ ] Messages display in correct order
- [ ] Mark messages as read
- [ ] Chat with multiple users

#### Gamification
- [ ] XP increases on actions
- [ ] Level auto-calculates from XP
- [ ] Streak increments daily
- [ ] Badges are awarded

### 5. Performance
- [ ] Images optimized
- [ ] Lazy loading implemented where needed
- [ ] Bundle size reasonable (check with `npm run build`)
- [ ] No memory leaks in components

### 6. Security
- [ ] No API keys in frontend code
- [ ] RLS policies prevent unauthorized access
- [ ] Storage policies secure
- [ ] Auth tokens handled securely

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import repository
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_PROJECT_ID`

3. **Configure Domain** (Optional)
   - Add custom domain in Vercel settings
   - Update DNS records

### Netlify

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all VITE_* variables

3. **Deploy**
   - Connect GitHub repo
   - Trigger deploy

### Custom VPS/Server

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder** to server

3. **Configure web server** (nginx/apache)
   - Serve static files from `dist`
   - Configure SPA fallback to index.html

## 📋 Post-Deployment

### Immediate Checks
- [ ] Site loads without errors
- [ ] Can sign up new user
- [ ] Can login existing user
- [ ] All images/assets load
- [ ] API calls to Supabase work
- [ ] Real-time features work

### Configuration
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate
- [ ] Set up monitoring/analytics
- [ ] Configure error tracking (Sentry)

### Supabase Production Settings
- [ ] Email templates customized
- [ ] Email provider configured (SMTP)
- [ ] Auth rate limiting configured
- [ ] Database backups enabled
- [ ] Monitor usage quotas

## 🔧 Troubleshooting

### Common Deployment Issues

**Build fails:**
- Check Node.js version matches local (18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Environment variables not working:**
- Ensure they start with `VITE_`
- Restart build after adding variables
- Check variable names match exactly

**404 on page refresh:**
- Configure SPA redirect rules
- Vercel: Add `vercel.json`
- Netlify: Add `_redirects` file

**Supabase connection fails:**
- Verify URL and keys in environment
- Check Supabase project is active
- Verify RLS policies allow access

**Images not loading:**
- Check paths are correct
- Verify storage bucket is public
- Check CORS settings on Supabase

## 📊 Monitoring

### Metrics to Track
- [ ] User signups
- [ ] Active users
- [ ] Exchange completion rate
- [ ] Message volume
- [ ] Error rate
- [ ] Page load times

### Tools
- Google Analytics
- Supabase Dashboard Analytics
- Vercel Analytics
- Sentry for error tracking

## 🔄 Continuous Deployment

Set up automatic deployments:
1. Push to `main` branch triggers production deploy
2. Push to `develop` branch triggers preview deploy
3. PRs create preview deployments

## 📝 Final Notes

- Keep Supabase project ID and keys secure
- Regularly backup database
- Monitor quota usage on Supabase free tier
- Update dependencies monthly
- Review RLS policies regularly

---

**Ready to deploy?** Complete all checkboxes above! ✅
