import {
  users,
  aiModels,
  chatSessions,
  chatMessages,
  systemSettings,
  uploadedFiles,
  type User,
  type UpsertUser,
  type AiModel,
  type InsertAiModel,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type SystemSetting,
  type InsertSystemSetting,
  type UploadedFile,
  type InsertUploadedFile,
  type ChatSessionWithMessages,
  type ChatSessionWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // AI Model operations
  getAiModels(activeOnly?: boolean): Promise<AiModel[]>;
  getAiModelById(id: string): Promise<AiModel | undefined>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: string, model: Partial<InsertAiModel>): Promise<AiModel | undefined>;
  deleteAiModel(id: string): Promise<boolean>;
  
  // Chat Session operations
  getChatSessionsByUserId(userId: string): Promise<ChatSessionWithUser[]>;
  getChatSessionById(id: string): Promise<ChatSessionWithMessages | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, session: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: string): Promise<boolean>;
  
  // Chat Message operations
  getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteMessagesBySessionId(sessionId: string): Promise<boolean>;
  
  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  getSystemSettings(): Promise<SystemSetting[]>;
  
  // File operations
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getUploadedFilesByUserId(userId: string): Promise<UploadedFile[]>;
  getUploadedFilesBySessionId(sessionId: string): Promise<UploadedFile[]>;
  getUploadedFileById(id: string): Promise<UploadedFile | undefined>;
  deleteUploadedFile(id: string): Promise<boolean>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }>;
  getUsageStats(): Promise<{ totalTokens: number; totalRequests: number; estimatedCost: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // AI Model operations
  async getAiModels(activeOnly = false): Promise<AiModel[]> {
    const query = db.select().from(aiModels);
    if (activeOnly) {
      return await query.where(eq(aiModels.isActive, true)).orderBy(aiModels.name);
    }
    return await query.orderBy(aiModels.name);
  }

  async getAiModelById(id: string): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const [created] = await db.insert(aiModels).values(model).returning();
    return created;
  }

  async updateAiModel(id: string, model: Partial<InsertAiModel>): Promise<AiModel | undefined> {
    const [updated] = await db
      .update(aiModels)
      .set({ ...model, updatedAt: new Date() })
      .where(eq(aiModels.id, id))
      .returning();
    return updated;
  }

  async deleteAiModel(id: string): Promise<boolean> {
    try {
      // First, update any chat sessions that reference this model to set modelId to null
      await db
        .update(chatSessions)
        .set({ modelId: null })
        .where(eq(chatSessions.modelId, id));
      
      // Then delete the model
      const result = await db.delete(aiModels).where(eq(aiModels.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting model:", error);
      throw error;
    }
  }

  // Chat Session operations
  async getChatSessionsByUserId(userId: string): Promise<ChatSessionWithUser[]> {
    const sessions = await db
      .select({
        id: chatSessions.id,
        userId: chatSessions.userId,
        title: chatSessions.title,
        modelId: chatSessions.modelId,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        modelName: aiModels.name,
        messageCount: sql<number>`cast(count(${chatMessages.id}) as int)`,
      })
      .from(chatSessions)
      .leftJoin(aiModels, eq(chatSessions.modelId, aiModels.id))
      .leftJoin(chatMessages, eq(chatSessions.id, chatMessages.sessionId))
      .where(eq(chatSessions.userId, userId))
      .groupBy(chatSessions.id, aiModels.name)
      .orderBy(desc(chatSessions.updatedAt));

    return sessions.map(session => ({
      ...session,
      model: session.modelName ? { name: session.modelName } as AiModel : undefined,
    })) as ChatSessionWithUser[];
  }

  async getChatSessionById(id: string): Promise<ChatSessionWithMessages | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .leftJoin(aiModels, eq(chatSessions.modelId, aiModels.id))
      .where(eq(chatSessions.id, id));

    if (!session) return undefined;

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.createdAt);

    return {
      ...session.chat_sessions,
      model: session.ai_models || undefined,
      messages,
    };
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [created] = await db.insert(chatSessions).values(session).returning();
    return created;
  }

  async updateChatSession(id: string, session: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    const [updated] = await db
      .update(chatSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return updated;
  }

  async deleteChatSession(id: string): Promise<boolean> {
    const result = await db.delete(chatSessions).where(eq(chatSessions.id, id));
    return result.rowCount > 0;
  }

  // Chat Message operations
  async getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async deleteMessagesBySessionId(sessionId: string): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    return result.rowCount > 0;
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [created] = await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: setting.value, updatedAt: new Date() },
      })
      .returning();
    return created;
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const [stats] = await db
      .select({
        totalUsers: sql<number>`cast(count(*) as int)`,
        adminUsers: sql<number>`cast(count(*) filter (where role = 'admin') as int)`,
      })
      .from(users);

    return {
      totalUsers: stats?.totalUsers || 0,
      activeUsers: stats?.totalUsers || 0, // Simplified for now
      adminUsers: stats?.adminUsers || 0,
    };
  }

  async getUsageStats(): Promise<{ totalTokens: number; totalRequests: number; estimatedCost: number }> {
    const [stats] = await db
      .select({
        totalTokens: sql<number>`cast(coalesce(sum(token_count), 0) as int)`,
        totalRequests: sql<number>`cast(count(*) as int)`,
      })
      .from(chatMessages)
      .where(sql`created_at >= date_trunc('month', current_date)`);

    const totalTokens = stats?.totalTokens || 0;
    const totalRequests = stats?.totalRequests || 0;
    const estimatedCost = totalTokens * 0.00003; // Rough estimate

    return { totalTokens, totalRequests, estimatedCost };
  }

  // File operations
  async createUploadedFile(fileData: InsertUploadedFile): Promise<UploadedFile> {
    const [file] = await db.insert(uploadedFiles).values(fileData).returning();
    return file;
  }

  async getUploadedFilesByUserId(userId: string): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.createdAt));
  }

  async getUploadedFilesBySessionId(sessionId: string): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.sessionId, sessionId))
      .orderBy(desc(uploadedFiles.createdAt));
  }

  async getUploadedFileById(id: string): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file;
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    const result = await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
