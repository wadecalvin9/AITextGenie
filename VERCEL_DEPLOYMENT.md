# Vercel Deployment Guide

Your chat application is now configured to support both same-origin and external API deployments.

## Current Configuration ✅

1. **Frontend API Support**: Added configurable API base URL support
2. **Static Build**: Frontend builds to `dist/public/` for static hosting
3. **Environment Variables**: Created `.env.example` with all required configuration

## Deployment Options

### Option 1: Frontend-Only on Vercel (Recommended)

Deploy just the frontend to Vercel as a static site and use an external backend:

1. **Deploy Backend Separately**:
   - Use Railway, Render, or Fly.io for backend
   - Get your backend URL (e.g., `https://your-app.up.railway.app`)

2. **Configure Frontend**:
   - In Vercel, set environment variable: `VITE_API_BASE_URL=https://your-backend-url`
   - Current `vercel.json` is configured for static deployment

3. **Benefits**:
   - Avoids Vercel's serverless function complexity
   - Better performance for frontend
   - Easier to scale backend independently

### Option 2: Different Platform for Full-Stack

Since Vercel's serverless functions are causing runtime issues, consider:

- **Railway**: Excellent for full-stack apps (one-click deploy)
- **Render**: Good for both frontend and backend
- **Fly.io**: Great for containerized deployments

## Current Vercel Setup

Your `vercel.json` is configured for static frontend deployment:
- ✅ Builds frontend only
- ✅ Serves from `dist/public/`
- ✅ Handles SPA routing

## Environment Variables Needed

Copy `.env.example` and configure:

```bash
# For external backend deployment
VITE_API_BASE_URL=https://your-backend-domain.com

# Your Supabase credentials
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Next Steps

1. Deploy your backend to Railway/Render/Fly.io
2. Get the backend URL
3. Set `VITE_API_BASE_URL` in Vercel environment variables
4. Redeploy to Vercel

Your frontend will then connect to the external backend API!