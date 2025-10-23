# SkillSwap - Gamified Skill Exchange Platform

A modern, retro-styled platform for exchanging skills and knowledge with a gamified learning experience.

## 🎮 Features

- **User Authentication** - Secure signup/login with Supabase Auth
- **Profile Management** - Customizable profiles with avatars, bio, and stats
- **Skill Listings** - Create and browse skill exchange opportunities
- **Real-time Chat** - Message other users directly
- **Swap Proposals** - Request skill exchanges with other members
- **Gamification** - XP, levels, streaks, and badges system
- **Exchange Management** - Track active, pending, and completed exchanges
- **Inbox System** - Manage incoming swap requests
- **Credits System** - Local credits for managing exchanges

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Shadcn/UI Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Animations:** Framer Motion
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mojo-learn-chat-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

The `.env` file is already configured with Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="zyzvxwnmzbwxgrtawqyy"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://zyzvxwnmzbwxgrtawqyy.supabase.co"
```

### 4. Supabase Database Setup

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref zyzvxwnmzbwxgrtawqyy
```

4. Push migrations:
```bash
supabase db push
```

#### Option B: Manual Setup via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `supabase/migrations/20251015043413_bcb4f1f1-5daa-4cd1-ad7a-e4e88e634a1e.sql`
   - `supabase/migrations/20251019104138_f121f55c-1989-48b4-871e-8fcd2e6b75c0.sql`
   - `supabase/migrations/20251019104159_632e55df-12a4-4ac8-b6ca-caf7b2a8b345.sql`
   - `supabase/migrations/20251021000000_create_avatars_bucket.sql`
   - `supabase/migrations/20251023000000_storage_and_features.sql`

### 5. Create Avatars Storage Bucket

In your Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Create a new bucket named `avatars`
3. Make it **Public**
4. The migration should have created the policies automatically

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:8080/

## 📁 Project Structure

```
mojo-learn-chat-main/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Shadcn/UI components
│   │   ├── Navbar.tsx
│   │   ├── ChatWidget.tsx
│   │   └── ...
│   ├── pages/           # Route pages
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Listings.tsx
│   │   └── ...
│   ├── integrations/    # External service integrations
│   │   └── supabase/
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── App.tsx
├── supabase/
│   └── migrations/      # Database migration files
├── public/
└── package.json
```

## 🗄️ Database Schema

### Tables:
- **profiles** - User profiles with XP, levels, streaks
- **skill_listings** - Skills users want to teach/learn
- **exchanges** - Active skill swaps between users
- **messages** - Chat messages
- **badges** - User achievements
- **courses** - Course catalog (future feature)
- **enrollments** - Course enrollments (future feature)

## 🎯 Key Features Implementation

### Authentication
- Email/password signup and login
- Email verification required
- Protected routes for authenticated users

### Gamification System
- **XP System**: Earn points for activities
- **Levels**: Auto-calculated from XP (level = floor(sqrt(xp/100)) + 1)
- **Streaks**: Daily login tracking
- **Badges**: Achievement system

### Real-time Features
- Live chat with Supabase Realtime
- Message notifications
- Auto-updating exchange status

### Credits System
- Local storage-based credits
- Refunds for abandoned exchanges
- Proportional refunds based on completed sessions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Styling

The app uses a retro pixel-art aesthetic with:
- Custom pixel-perfect borders
- Retro animations
- Gradient effects
- Glass morphism cards

CSS classes:
- `.pixel-corners` - Retro border style
- `.retro-text` - Pixel font text
- `.glass` - Glass morphism effect
- `.gradient-primary` - Primary gradient

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

## 📝 Common Issues & Solutions

### Issue: "Storage bucket not found"
**Solution:** Create the `avatars` bucket in Supabase Dashboard → Storage, and make it public.

### Issue: "Profile not found" after signup
**Solution:** The app auto-creates profiles. Check the `profiles` table exists and RLS policies are enabled.

### Issue: Messages not appearing in real-time
**Solution:** Ensure Supabase Realtime is enabled for the `messages` table in your project settings.

### Issue: Cannot upload avatars
**Solution:** 
1. Verify the `avatars` bucket exists and is public
2. Check storage policies are created (run the latest migration)
3. Ensure RLS is enabled on `storage.objects`

## 🚢 Deployment

### Using Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Using Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Need help?** Check the `/support` page in the app or open an issue on GitHub.
