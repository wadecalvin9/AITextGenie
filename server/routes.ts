import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import { OpenRouterService } from "./services/openrouter";
import { 
  insertAiModelSchema,
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertSystemSettingSchema,
  insertUploadedFileSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const openRouterService = new OpenRouterService();

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/json'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    cb(null, isAllowed);
  },
});

// Middleware to check admin role
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
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



  // Auth routes are now handled in setupAuth function

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
      const userId = req.user.id;
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
      const userId = req.user.id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  // Get session messages endpoint
  app.get('/api/chat/sessions/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getChatSessionById(id);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Check if user owns this session
      const userId = req.user.id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get messages for this session
      const messages = await storage.getMessagesBySessionId(id);
      
      res.json({
        title: session.title,
        modelId: session.modelId,
        messages: messages || []
      });
    } catch (error) {
      console.error("Error fetching session messages:", error);
      res.status(500).json({ message: "Failed to fetch session messages" });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      
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
    // Try to authenticate user if token is provided, but don't require it (allow guests)
    if (req.headers.authorization) {
      try {
        const authResult = await import('./supabaseAuth.js').then(m => m.authenticateToken(req.headers.authorization));
        if (authResult) {
          (req as any).user = authResult;
        }
      } catch (error) {
        console.log('Auth failed for chat message, proceeding as guest');
      }
    }
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
      if (!isGuest && (req as any).user?.id) {
        const userId = (req as any).user.id;
        
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

  // Get public system settings (like default model)
  app.get('/api/settings/public', async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      // Only return non-sensitive settings
      const publicSettings = settings
        .filter((setting: any) => !setting.key.includes('key') && !setting.key.includes('secret'))
        .reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
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

  // File upload routes
  app.post('/api/files/upload', isAuthenticated, upload.array('files', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = (req as any).user?.id;
      const sessionId = req.body.sessionId;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedFiles = [];

      for (const file of files) {
        // Process file content for AI analysis
        let processedContent = '';
        
        if (file.mimetype.startsWith('text/')) {
          try {
            processedContent = await fs.readFile(file.path, 'utf-8');
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        } else if (file.mimetype === 'application/json') {
          try {
            const jsonContent = await fs.readFile(file.path, 'utf-8');
            processedContent = JSON.stringify(JSON.parse(jsonContent), null, 2);
          } catch (error) {
            console.error('Error processing JSON file:', error);
          }
        }

        const fileData = {
          userId,
          sessionId: sessionId || null,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          processedContent: processedContent || null,
        };

        const uploadedFile = await storage.createUploadedFile(fileData);
        uploadedFiles.push(uploadedFile);
      }

      res.json({ 
        message: 'Files uploaded successfully',
        files: uploadedFiles 
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  });

  // Get user's uploaded files
  app.get('/api/files', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const files = await storage.getUploadedFilesByUserId(userId);
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ message: 'Failed to fetch files' });
    }
  });

  // Get files for a specific session
  app.get('/api/files/session/:sessionId', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const files = await storage.getUploadedFilesBySessionId(sessionId);
      res.json(files);
    } catch (error) {
      console.error('Error fetching session files:', error);
      res.status(500).json({ message: 'Failed to fetch session files' });
    }
  });

  // Delete uploaded file
  app.delete('/api/files/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const file = await storage.getUploadedFileById(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check if user owns the file
      if (file.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(file.filePath);
      } catch (error) {
        console.error('Error deleting file from filesystem:', error);
      }

      // Delete from database
      const deleted = await storage.deleteUploadedFile(id);
      if (deleted) {
        res.json({ message: 'File deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete file' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
