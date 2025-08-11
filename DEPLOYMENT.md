# Deployment Guide

This AI chat platform is designed to be easily deployed on multiple platforms. Here's how to deploy it smoothly on different services.

## Prerequisites

Before deploying, you'll need:
1. **Supabase account** - For authentication and database
2. **OpenRouter API key** - For AI model access (admin can add this later)

## Platform-Specific Deployment

### 1. Vercel Deployment

**Step 1: Connect Repository**
1. Fork this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and import your project
3. Vercel will auto-detect it as a Node.js project

**Step 2: Configure Environment Variables**
In Vercel dashboard, add these environment variables:

```bash
# Required - Database
DATABASE_URL=your_supabase_database_url

# Required - Supabase Authentication
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Session Security
SESSION_SECRET=random_32_character_string

# Optional - Rate Limiting (recommended for production)
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
```

**Step 3: Deploy**
- Click "Deploy" and Vercel will build and deploy automatically
- Your app will be available at `https://your-project.vercel.app`

### 2. Netlify Deployment

**Step 1: Connect Repository**
1. Go to [netlify.com](https://netlify.com) and connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

**Step 2: Configure Environment Variables**
Add the same environment variables as above in Netlify's site settings.

**Step 3: Configure Functions**
Netlify will automatically handle the serverless functions.

### 3. Railway Deployment

**Step 1: Connect Repository**
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repository

**Step 2: Add PostgreSQL Database**
1. Add PostgreSQL service to your project
2. Railway will automatically provide DATABASE_URL

**Step 3: Configure Environment Variables**
Add the Supabase environment variables (DATABASE_URL is automatic).

### 4. Render Deployment

**Step 1: Create Web Service**
1. Go to [render.com](https://render.com)
2. Create new "Web Service" from your repository
3. Use these settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

**Step 2: Add PostgreSQL Database**
1. Create PostgreSQL database service
2. Copy the connection string to DATABASE_URL

**Step 3: Environment Variables**
Add all required environment variables in Render dashboard.

### 5. DigitalOcean App Platform

**Step 1: Create App**
1. Go to DigitalOcean App Platform
2. Connect your GitHub repository

**Step 2: Configure Build**
- Autodeploy: Yes
- Source Directory: `/`
- Build Command: `npm run build`
- Run Command: `npm start`

**Step 3: Add Database**
1. Add managed PostgreSQL database
2. Use connection string for DATABASE_URL

## Quick Setup Script

To make deployment even easier, here's what you need to do:

### 1. Set Up Supabase (5 minutes)
```bash
# 1. Go to supabase.com and create new project
# 2. Copy these values from Settings > API:
#    - Project URL (SUPABASE_URL)
#    - anon/public key (VITE_SUPABASE_ANON_KEY)
#    - service_role key (SUPABASE_SERVICE_ROLE_KEY)
# 3. Copy Database URL from Settings > Database
```

### 2. Configure Your Platform
1. Add the environment variables above
2. Deploy
3. Access your app and create admin account
4. Add OpenRouter API key in admin panel

## Environment Variables Quick Reference

**Required:**
- `DATABASE_URL` - PostgreSQL connection
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key
- `VITE_SUPABASE_URL` - Client-side Supabase URL (same as above)
- `VITE_SUPABASE_ANON_KEY` - Client-side Supabase anonymous key

**Optional but Recommended:**
- `SESSION_SECRET` - Random 32+ character string for session security
- `RATE_LIMIT_MAX` - Max requests per window (default: 100)
- `RATE_LIMIT_WINDOW` - Rate limit window in ms (default: 900000)

## Post-Deployment Setup

1. **Create Admin Account**: Sign up with your email
2. **Add AI Models**: Go to Admin panel > Model Management
3. **Configure API Keys**: Add your OpenRouter API key
4. **Test Chat**: Try sending a message to ensure everything works

## Troubleshooting

**Build Errors:**
- Ensure all required environment variables are set
- Check that DATABASE_URL is a valid PostgreSQL connection string

**Runtime Errors:**
- Verify Supabase credentials are correct
- Check that your database is accessible
- Ensure OpenRouter API key is valid (add in admin panel)

**Authentication Issues:**
- Verify SUPABASE_URL matches between server and client variables
- Check that VITE_ prefixed variables are set for the frontend

## Platform Recommendations

- **Vercel**: Best for quick deployments, excellent DX
- **Railway**: Great for full-stack apps, includes database
- **Render**: Good balance of features and pricing
- **Netlify**: Excellent for static sites with functions
- **DigitalOcean**: Good for more control and scaling

All platforms support this application out of the box with minimal configuration!