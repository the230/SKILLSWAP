import { 
  User, InsertUser, Category, InsertCategory, 
  TeachingSkill, InsertTeachingSkill, LearningSkill, InsertLearningSkill,
  Exchange, InsertExchange, Message, InsertMessage,
  users, categories, teachingSkills, learningSkills, exchanges, messages
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import { db, pool } from './db';
import { eq, or, and, desc } from 'drizzle-orm';
import { IStorage } from './storage';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session' 
    });
    
    // Seed categories (only if needed)
    this.seedCategories();
  }
  
  private async seedCategories() {
    try {
      // Check if categories table is empty
      const existingCategories = await db.select().from(categories);
      
      if (existingCategories.length === 0) {
        const categoriesToSeed = [
          { name: "Programming" },
          { name: "Music" },
          { name: "Cooking" },
          { name: "Art" },
          { name: "Finance" },
          { name: "Media" },
          { name: "Languages" },
          { name: "Sports" },
          { name: "Academics" },
          { name: "Professional" },
          { name: "Crafts" }
        ];
        
        for (const category of categoriesToSeed) {
          await this.createCategory(category);
        }
        console.log('Categories seeded successfully.');
      }
    } catch (error) {
      console.error('Error seeding categories:', error);
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }
  
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }
  
  // Teaching Skills operations
  async getTeachingSkills(): Promise<TeachingSkill[]> {
    return await db.select().from(teachingSkills);
  }
  
  async getTeachingSkillById(id: number): Promise<TeachingSkill | undefined> {
    const result = await db.select().from(teachingSkills).where(eq(teachingSkills.id, id));
    return result[0];
  }
  
  async getTeachingSkillsByUserId(userId: number): Promise<TeachingSkill[]> {
    return await db.select().from(teachingSkills).where(eq(teachingSkills.userId, userId));
  }
  
  async getTeachingSkillsByCategory(categoryId: number): Promise<TeachingSkill[]> {
    return await db.select().from(teachingSkills).where(eq(teachingSkills.categoryId, categoryId));
  }
  
  async createTeachingSkill(skillData: InsertTeachingSkill): Promise<TeachingSkill> {
    const [skill] = await db.insert(teachingSkills).values(skillData).returning();
    return skill;
  }
  
  async updateTeachingSkill(id: number, skillData: Partial<TeachingSkill>): Promise<TeachingSkill | undefined> {
    const [updatedSkill] = await db.update(teachingSkills)
      .set(skillData)
      .where(eq(teachingSkills.id, id))
      .returning();
    
    return updatedSkill;
  }
  
  async deleteTeachingSkill(id: number): Promise<boolean> {
    await db.delete(teachingSkills).where(eq(teachingSkills.id, id));
    return true; // In a real DB context, we'd check if rows were affected
  }
  
  // Learning Skills operations
  async getLearningSkills(): Promise<LearningSkill[]> {
    return await db.select().from(learningSkills);
  }
  
  async getLearningSkillById(id: number): Promise<LearningSkill | undefined> {
    const result = await db.select().from(learningSkills).where(eq(learningSkills.id, id));
    return result[0];
  }
  
  async getLearningSkillsByUserId(userId: number): Promise<LearningSkill[]> {
    return await db.select().from(learningSkills).where(eq(learningSkills.userId, userId));
  }
  
  async getLearningSkillsByCategory(categoryId: number): Promise<LearningSkill[]> {
    return await db.select().from(learningSkills).where(eq(learningSkills.categoryId, categoryId));
  }
  
  async createLearningSkill(skillData: InsertLearningSkill): Promise<LearningSkill> {
    const [skill] = await db.insert(learningSkills).values(skillData).returning();
    return skill;
  }
  
  async updateLearningSkill(id: number, skillData: Partial<LearningSkill>): Promise<LearningSkill | undefined> {
    const [updatedSkill] = await db.update(learningSkills)
      .set(skillData)
      .where(eq(learningSkills.id, id))
      .returning();
    
    return updatedSkill;
  }
  
  async deleteLearningSkill(id: number): Promise<boolean> {
    await db.delete(learningSkills).where(eq(learningSkills.id, id));
    return true;
  }
  
  // Exchange operations
  async getExchanges(): Promise<Exchange[]> {
    return await db.select().from(exchanges);
  }
  
  async getExchangeById(id: number): Promise<Exchange | undefined> {
    const result = await db.select().from(exchanges).where(eq(exchanges.id, id));
    return result[0];
  }
  
  async getExchangesByUserId(userId: number): Promise<Exchange[]> {
    return await db.select().from(exchanges).where(
      or(
        eq(exchanges.requesterId, userId),
        eq(exchanges.providerId, userId)
      )
    );
  }
  
  async getExchangesByStatus(status: string): Promise<Exchange[]> {
    return await db.select().from(exchanges).where(eq(exchanges.status, status));
  }
  
  async createExchange(exchangeData: InsertExchange): Promise<Exchange> {
    const [exchange] = await db.insert(exchanges).values({
      ...exchangeData,
      status: 'pending'
    }).returning();
    
    return exchange;
  }
  
  async updateExchangeStatus(id: number, status: string): Promise<Exchange | undefined> {
    const [updatedExchange] = await db.update(exchanges)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(exchanges.id, id))
      .returning();
    
    return updatedExchange;
  }
  
  // Message operations
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.createdAt);
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }
  
  async getMessagesByExchangeId(exchangeId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.exchangeId, exchangeId))
      .orderBy(messages.createdAt);
  }
  
  async getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.receiverId, receiverId)
          ),
          and(
            eq(messages.senderId, receiverId),
            eq(messages.receiverId, senderId)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getUnreadMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      ...messageData,
      read: false
    }).returning();
    
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    
    return updatedMessage;
  }
}