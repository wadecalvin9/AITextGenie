# Render Deployment Guide

Deploy your entire AI chat application to Render with both frontend and backend together.

## Why Render?

- **Free Tier**: Perfect for hobby projects and demos
- **Full-Stack Support**: Handles both React frontend and Node.js backend
- **Auto-Deploy**: Connects to GitHub for automatic deployments
- **Built-in Database**: Free PostgreSQL database included
- **Zero Config**: Works with your existing setup

## Deployment Steps

### 1. Prepare Your Repository

Your app is already configured! The key files are ready:
- ✅ `render.yaml` - Render configuration
- ✅ `package.json` - Build scripts configured
- ✅ `vercel.json` - Can be ignored for Render

### 2. Deploy to Render

1. **Connect GitHub**:
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Connect your repository

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Select your repository
   - Render will detect the `render.yaml` automatically

3. **Configure Environment Variables**:
   Set these in Render dashboard:
   ```
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENROUTER_API_KEY=your-openrouter-key
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 3. Database Setup

Render will automatically:
- Create a free PostgreSQL database
- Set the `DATABASE_URL` environment variable
- Connect it to your web service

After deployment, run your database migrations:
```bash
# Render will run this automatically during build
npm run db:push
```

### 4. Access Your App

Once deployed, Render gives you:
- **App URL**: `https://your-app-name.onrender.com`
- **Database**: Automatically connected
- **Auto-deploys**: Every GitHub push triggers deployment

## Environment Variables Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase → Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter API key | OpenRouter dashboard |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | Same as above |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase → Settings → API |

## Build Process

Render will automatically:

1. **Install Dependencies**: `npm install`
2. **Build Frontend**: `vite build` (creates `dist/public/`)
3. **Build Backend**: `esbuild server/index.ts` (creates `dist/index.js`)
4. **Start App**: `npm start` (serves both frontend and API)

## Free Tier Limits

- **Compute**: 750 hours/month (enough for always-on hobby projects)
- **Database**: 1GB storage, 1M rows
- **Bandwidth**: 100GB/month
- **Sleep**: Apps sleep after 15 minutes of inactivity (wake up automatically)

## Advantages of Render

✅ **Single Deployment**: Both frontend and backend together  
✅ **Free Database**: PostgreSQL included  
✅ **Auto-Deploy**: GitHub integration  
✅ **HTTPS**: Automatic SSL certificates  
✅ **Custom Domains**: Free subdomain, paid custom domains  

## Next Steps

1. Push your code to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy!

Your chat application will be live at `https://your-app-name.onrender.com` with full functionality!