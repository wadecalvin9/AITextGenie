// Centralized configuration management for the application
// Sensitive values come from environment variables (Replit secrets)
// Non-sensitive defaults are defined here

export const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },

  // Supabase Configuration
  supabase: {
    // Server-side configuration
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Client-side configuration (VITE_ prefixed)
    clientUrl: process.env.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
  },

  // Replit Configuration
  replit: {
    domains: process.env.REPLIT_DOMAINS,
    replId: process.env.REPL_ID,
    issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    ttl: parseInt(process.env.SESSION_TTL || '86400000'), // 24 hours in milliseconds
    tableName: 'sessions',
  },

  // OpenRouter API Configuration
  openRouter: {
    baseUrl: process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1',
    referer: process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000',
  },

  // Rate Limiting Configuration
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: [
      'text/plain',
      'text/csv',
      'text/javascript',
      'text/typescript',
      'application/json',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
    ],
  },

  // Default System Settings
  defaults: {
    allowGuests: true,
    rateLimit: '100',
    maxFileSize: '10MB',
    defaultModel: null, // Will be set by admin
  },
};

// Validation function to check required environment variables
export function validateConfig() {
  const required = [
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about optional but recommended variables
  const recommended = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    console.warn('Some features may not work correctly without these variables.');
  }
}

export default config;