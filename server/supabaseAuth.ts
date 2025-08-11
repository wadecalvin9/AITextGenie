import { createClient } from '@supabase/supabase-js';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to validate JWT tokens and extract user info
export const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };

    // Ensure user exists in our database
    await storage.upsertUser({
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      profileImageUrl: user.user_metadata?.avatar_url || null,
    });

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication service error' });
  }
};

// Setup auth routes
export async function setupAuth(app: Express) {
  // Get current user info
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Sign up endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ 
        message: 'User created successfully',
        user: data.user,
        session: data.session
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Sign in endpoint
  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        message: 'Signed in successfully',
        user: data.user,
        session: data.session
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Sign out endpoint
  app.post('/api/auth/signout', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.signOut();
      }

      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Refresh token endpoint
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refresh_token } = req.body;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({
        message: 'Token refreshed successfully',
        session: data.session
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

export { supabase };