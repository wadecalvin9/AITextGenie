import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { OpenRouterService } from "./services/openrouter";
import { 
  insertAiModelSchema,
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertSystemSettingSchema,
} from "@shared/schema";
import { z } from "zod";

const openRouterService = new OpenRouterService();

// Middleware to check admin role
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Models routes
  app.get('/api/models', async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const models = await storage.getAiModels(activeOnly);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  // Get OpenRouter models (Admin only)
  app.get('/api/openrouter/models', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const apiKeySetting = await storage.getSystemSetting('openrouter_api_key');
      if (!apiKeySetting?.value) {
        return res.status(400).json({ message: "OpenRouter API key not configured" });
      }

      const models = await openRouterService.getAvailableModels(apiKeySetting.value);
      res.json(models);
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      res.status(500).json({ message: "Failed to fetch OpenRouter models" });
    }
  });

  app.post('/api/models', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const modelData = insertAiModelSchema.parse(req.body);
      const model = await storage.createAiModel(modelData);
      res.json(model);
    } catch (error) {
      console.error("Error creating model:", error);
      res.status(400).json({ message: "Failed to create model" });
    }
  });

  app.put('/api/models/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const modelData = insertAiModelSchema.partial().parse(req.body);
      const model = await storage.updateAiModel(id, modelData);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Error updating model:", error);
      res.status(400).json({ message: "Failed to update model" });
    }
  });

  app.delete('/api/models/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAiModel(id);
      if (!success) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ message: "Failed to delete model" });
    }
  });

  // Chat Sessions routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessionsByUserId(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.get('/api/chat/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getChatSessionById(id);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Check if user owns this session
      const userId = req.user.claims.sub;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertChatSessionSchema.parse({
        ...req.body,
        userId,
      });
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(400).json({ message: "Failed to create chat session" });
    }
  });

  app.delete('/api/chat/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if user owns this session
      const session = await storage.getChatSessionById(id);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteChatSession(id);
      if (!success) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Chat Messages routes
  app.post('/api/chat/message', async (req, res) => {
    try {
      const { message, modelId, sessionId, isGuest } = req.body;
      
      if (!message || !modelId) {
        return res.status(400).json({ message: "Message and model ID are required" });
      }

      // Get the API key from system settings
      const apiKeySetting = await storage.getSystemSetting('openrouter_api_key');
      if (!apiKeySetting?.value) {
        return res.status(500).json({ message: "OpenRouter API key not configured" });
      }

      // Get model details
      const model = await storage.getAiModelById(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      let chatSessionId = sessionId;
      
      // For authenticated users, handle session management
      if (!isGuest && req.isAuthenticated() && (req.user as any)?.claims?.sub) {
        const userId = (req.user as any).claims.sub;
        
        if (!sessionId) {
          // Create new session
          const session = await storage.createChatSession({
            userId,
            title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
            modelId,
          });
          chatSessionId = session.id;
        }

        // Save user message
        await storage.createChatMessage({
          sessionId: chatSessionId,
          role: 'user',
          content: message,
          tokenCount: Math.ceil(message.length / 4), // Rough token estimate
        });
      }

      // Get chat history for context (if session exists)
      let messages = [{ role: 'user', content: message }];
      if (chatSessionId) {
        const sessionMessages = await storage.getMessagesBySessionId(chatSessionId);
        messages = sessionMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
        messages.push({ role: 'user', content: message });
      }

      // Call OpenRouter API
      const response = await openRouterService.createChatCompletion({
        model: model.modelId,
        messages: messages as any[],
        apiKey: apiKeySetting.value,
      });

      // Save AI response for authenticated users
      if (!isGuest && chatSessionId) {
        await storage.createChatMessage({
          sessionId: chatSessionId,
          role: 'assistant',
          content: response.content,
          tokenCount: response.tokenCount,
        });
      }

      res.json({
        content: response.content,
        sessionId: chatSessionId,
        tokenCount: response.tokenCount,
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // OpenRouter models endpoint
  app.get('/api/openrouter/models', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const apiKeySetting = await storage.getSystemSetting('openrouter_api_key');
      if (!apiKeySetting?.value) {
        return res.status(400).json({ error: 'OpenRouter API key not configured' });
      }
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKeySetting.value}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch OpenRouter models');
      }
      
      const data = await response.json();
      res.json(data.data || []);
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  // System Settings routes (Admin only)
  app.get('/api/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      // Don't expose sensitive values like API keys in full
      const sanitizedSettings = settings.map(setting => ({
        ...setting,
        value: setting.key.includes('key') ? '****' : setting.value,
      }));
      res.json(sanitizedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settingData = insertSystemSettingSchema.parse(req.body);
      const setting = await storage.setSystemSetting(settingData);
      res.json(setting);
    } catch (error) {
      console.error("Error saving setting:", error);
      res.status(400).json({ message: "Failed to save setting" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [userStats, usageStats] = await Promise.all([
        storage.getUserStats(),
        storage.getUsageStats(),
      ]);
      res.json({ ...userStats, ...usageStats });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
