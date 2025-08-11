# Configuration Management

This project uses a centralized configuration system to manage all environment variables and settings. This makes it easier to manage, update, and maintain configuration across the entire application.

## Configuration Files

### `/server/config.ts`
The main configuration file that centralizes all environment variables and provides type safety, defaults, and validation.

### `/.env.example`
Template file showing all the environment variables needed for the project. Copy this to create your local configuration.

## Required Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string (automatically provided by Replit)

### Supabase (Authentication & Storage)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side service role key (sensitive)
- `VITE_SUPABASE_URL` - Client-side Supabase URL (same as above, VITE_ prefix required)
- `VITE_SUPABASE_ANON_KEY` - Client-side anonymous key for public operations

### Replit Configuration (Optional)
- `REPLIT_DOMAINS` - Comma-separated list of your Replit domains
- `REPL_ID` - Your Replit project ID
- `ISSUER_URL` - OIDC issuer URL (defaults to https://replit.com/oidc)
- `SESSION_SECRET` - Secret for session encryption

## Optional Environment Variables (with defaults)

### Server Configuration
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (default: development)

### OpenRouter API
- `OPENROUTER_API_BASE_URL` - Base URL for OpenRouter API (default: https://openrouter.ai/api/v1)

### Session Management
- `SESSION_TTL` - Session time-to-live in milliseconds (default: 86400000 = 24 hours)

### Rate Limiting
- `RATE_LIMIT_MAX` - Maximum requests per window (default: 100)
- `RATE_LIMIT_WINDOW` - Rate limit window in milliseconds (default: 900000 = 15 minutes)

### File Upload
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 10485760 = 10MB)
- `UPLOAD_PATH` - Directory for uploaded files (default: ./uploads)

## Setting Up Environment Variables in Replit

1. **Open the Secrets tab** in your Replit project
2. **Add the required variables** listed above
3. **For sensitive keys** (API keys, passwords), always use Replit Secrets
4. **For public configuration**, you can use Replit Secrets or the Environment Variables section

## Configuration Access in Code

### Server-side (Node.js)
```typescript
import { config } from './config';

// Access any configuration value
const port = config.server.port;
const dbUrl = config.database.url;
const supabaseUrl = config.supabase.url;
```

### Client-side (React)
```typescript
// Only VITE_ prefixed variables are available on the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Validation

The configuration system includes automatic validation:
- **Required variables** will throw errors if missing
- **Recommended variables** will show warnings if missing
- **Type validation** ensures numbers are parsed correctly
- **Default values** are provided for optional settings

## Security Best Practices

1. **Never commit sensitive keys** to your code repository
2. **Use Replit Secrets** for all API keys and passwords
3. **Use VITE_ prefix** for any environment variables needed on the client-side
4. **Keep the `.env.example` file updated** but never include actual secrets
5. **Validate all configuration** on server startup

## Adding New Configuration

1. **Add the environment variable** to `server/config.ts`
2. **Update `.env.example`** with the new variable
3. **Update this documentation** with the new variable
4. **Add validation** if the variable is required
5. **Use the centralized config** throughout your code instead of `process.env` directly