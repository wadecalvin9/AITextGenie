# Quick Deployment Guide - 5 Minutes Setup

This guide will get your AI chat platform deployed in under 5 minutes on any major platform.

## Prerequisites (2 minutes)

### 1. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com) → "New Project"
2. Wait for database to initialize
3. Go to Settings → API → Copy these 4 values:
   ```
   Project URL → SUPABASE_URL & VITE_SUPABASE_URL
   anon public → VITE_SUPABASE_ANON_KEY
   service_role → SUPABASE_SERVICE_ROLE_KEY
   ```
4. Go to Settings → Database → Copy:
   ```
   Connection string → DATABASE_URL
   ```

## Platform Deployment (3 minutes)

### Option A: Vercel (Recommended - Fastest)
1. Fork this repo to your GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project" → Import your fork
3. Add Environment Variables:
   ```
   DATABASE_URL=your_supabase_connection_string
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SESSION_SECRET=any_random_32_character_string
   ```
4. Click "Deploy"
5. Your app is live at `https://your-project.vercel.app`

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com) → "New site from Git"
2. Connect your repository
3. Build settings are auto-configured via `netlify.toml`
4. Add the same environment variables as above
5. Deploy

### Option C: Railway
1. Go to [railway.app](https://railway.app) → "New Project"
2. Connect GitHub repository
3. Add PostgreSQL service (DATABASE_URL auto-configured)
4. Add Supabase environment variables
5. Deploy

### Option D: Render
1. Go to [render.com](https://render.com) → "New Web Service"
2. Connect repository
3. Build settings are auto-configured via `render.yaml`
4. Add PostgreSQL database
5. Add environment variables
6. Deploy

## Post-Deployment Setup (30 seconds)

1. **Visit your deployed app**
2. **Sign up** with your email (first user becomes admin)
3. **Go to Admin Panel** → Model Management
4. **Add OpenRouter API key** (get free one at [openrouter.ai](https://openrouter.ai))
5. **Test chat** - Send a message to verify everything works

## Environment Variables Reference

**Copy-paste template:**
```bash
# Required
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Recommended
SESSION_SECRET=your_random_32_character_string
RATE_LIMIT_MAX=1000
```

## Troubleshooting

**Build fails?**
- Check all environment variables are set
- Ensure DATABASE_URL is valid PostgreSQL connection

**Can't sign in?**
- Verify SUPABASE_URL matches between server and client variables
- Check Supabase project is active

**AI not responding?**
- Add OpenRouter API key in Admin Panel → Model Management
- Ensure you have models configured

## Support

- All deployment configurations are included in the repository
- Health checks are configured for all platforms
- Database migrations run automatically
- Static files are properly configured

**Estimated total setup time: 4-6 minutes**