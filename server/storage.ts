import { 
  User, InsertUser, Category, InsertCategory, 
  TeachingSkill, InsertTeachingSkill, LearningSkill, InsertLearningSkill,
  Exchange, InsertExchange, Message, InsertMessage
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store as SessionStore } from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Teaching Skills operations
  getTeachingSkills(): Promise<TeachingSkill[]>;
  getTeachingSkillById(id: number): Promise<TeachingSkill | undefined>;
  getTeachingSkillsByUserId(userId: number): Promise<TeachingSkill[]>;
  getTeachingSkillsByCategory(categoryId: number): Promise<TeachingSkill[]>;
  createTeachingSkill(skill: InsertTeachingSkill): Promise<TeachingSkill>;
  updateTeachingSkill(id: number, skillData: Partial<TeachingSkill>): Promise<TeachingSkill | undefined>;
  deleteTeachingSkill(id: number): Promise<boolean>;
  
  // Learning Skills operations
  getLearningSkills(): Promise<LearningSkill[]>;
  getLearningSkillById(id: number): Promise<LearningSkill | undefined>;
  getLearningSkillsByUserId(userId: number): Promise<LearningSkill[]>;
  getLearningSkillsByCategory(categoryId: number): Promise<LearningSkill[]>;
  createLearningSkill(skill: InsertLearningSkill): Promise<LearningSkill>;
  updateLearningSkill(id: number, skillData: Partial<LearningSkill>): Promise<LearningSkill | undefined>;
  deleteLearningSkill(id: number): Promise<boolean>;
  
  // Exchange operations
  getExchanges(): Promise<Exchange[]>;
  getExchangeById(id: number): Promise<Exchange | undefined>;
  getExchangesByUserId(userId: number): Promise<Exchange[]>;
  getExchangesByStatus(status: string): Promise<Exchange[]>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchangeStatus(id: number, status: string): Promise<Exchange | undefined>;
  
  // Message operations
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByExchangeId(exchangeId: number): Promise<Message[]>;
  getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]>;
  getUnreadMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private teachingSkills: Map<number, TeachingSkill>;
  private learningSkills: Map<number, LearningSkill>;
  private exchanges: Map<number, Exchange>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private teachingSkillIdCounter: number;
  private learningSkillIdCounter: number;
  private exchangeIdCounter: number;
  private messageIdCounter: number;
  
  sessionStore: SessionStore;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.teachingSkills = new Map();
    this.learningSkills = new Map();
    this.exchanges = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.teachingSkillIdCounter = 1;
    this.learningSkillIdCounter = 1;
    this.exchangeIdCounter = 1;
    this.messageIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add initial categories
    this.createCategory({ name: "Programming" });
    this.createCategory({ name: "Music" });
    this.createCategory({ name: "Cooking" });
    this.createCategory({ name: "Art" });
    this.createCategory({ name: "Finance" });
    this.createCategory({ name: "Media" });
    this.createCategory({ name: "Languages" });
    this.createCategory({ name: "Sports" });
    this.createCategory({ name: "Academics" });
    this.createCategory({ name: "Professional" });
    this.createCategory({ name: "Crafts" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { id, ...userData, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { id, ...categoryData };
    this.categories.set(id, category);
    return category;
  }
  
  // Teaching Skills operations
  async getTeachingSkills(): Promise<TeachingSkill[]> {
    return Array.from(this.teachingSkills.values());
  }
  
  async getTeachingSkillById(id: number): Promise<TeachingSkill | undefined> {
    return this.teachingSkills.get(id);
  }
  
  async getTeachingSkillsByUserId(userId: number): Promise<TeachingSkill[]> {
    return Array.from(this.teachingSkills.values()).filter(skill => skill.userId === userId);
  }
  
  async getTeachingSkillsByCategory(categoryId: number): Promise<TeachingSkill[]> {
    return Array.from(this.teachingSkills.values()).filter(skill => skill.categoryId === categoryId);
  }
  
  async createTeachingSkill(skillData: InsertTeachingSkill): Promise<TeachingSkill> {
    const id = this.teachingSkillIdCounter++;
    const createdAt = new Date();
    const skill: TeachingSkill = { id, ...skillData, createdAt };
    this.teachingSkills.set(id, skill);
    return skill;
  }
  
  async updateTeachingSkill(id: number, skillData: Partial<TeachingSkill>): Promise<TeachingSkill | undefined> {
    const skill = await this.getTeachingSkillById(id);
    if (!skill) return undefined;
    
    const updatedSkill = { ...skill, ...skillData };
    this.teachingSkills.set(id, updatedSkill);
    return updatedSkill;
  }
  
  async deleteTeachingSkill(id: number): Promise<boolean> {
    return this.teachingSkills.delete(id);
  }
  
  // Learning Skills operations
  async getLearningSkills(): Promise<LearningSkill[]> {
    return Array.from(this.learningSkills.values());
  }
  
  async getLearningSkillById(id: number): Promise<LearningSkill | undefined> {
    return this.learningSkills.get(id);
  }
  
  async getLearningSkillsByUserId(userId: number): Promise<LearningSkill[]> {
    return Array.from(this.learningSkills.values()).filter(skill => skill.userId === userId);
  }
  
  async getLearningSkillsByCategory(categoryId: number): Promise<LearningSkill[]> {
    return Array.from(this.learningSkills.values()).filter(skill => skill.categoryId === categoryId);
  }
  
  async createLearningSkill(skillData: InsertLearningSkill): Promise<LearningSkill> {
    const id = this.learningSkillIdCounter++;
    const createdAt = new Date();
    const skill: LearningSkill = { id, ...skillData, createdAt };
    this.learningSkills.set(id, skill);
    return skill;
  }
  
  async updateLearningSkill(id: number, skillData: Partial<LearningSkill>): Promise<LearningSkill | undefined> {
    const skill = await this.getLearningSkillById(id);
    if (!skill) return undefined;
    
    const updatedSkill = { ...skill, ...skillData };
    this.learningSkills.set(id, updatedSkill);
    return updatedSkill;
  }
  
  async deleteLearningSkill(id: number): Promise<boolean> {
    return this.learningSkills.delete(id);
  }
  
  // Exchange operations
  async getExchanges(): Promise<Exchange[]> {
    return Array.from(this.exchanges.values());
  }
  
  async getExchangeById(id: number): Promise<Exchange | undefined> {
    return this.exchanges.get(id);
  }
  
  async getExchangesByUserId(userId: number): Promise<Exchange[]> {
    return Array.from(this.exchanges.values()).filter(
      exchange => exchange.requesterId === userId || exchange.providerId === userId
    );
  }
  
  async getExchangesByStatus(status: string): Promise<Exchange[]> {
    return Array.from(this.exchanges.values()).filter(exchange => exchange.status === status);
  }
  
  async createExchange(exchangeData: InsertExchange): Promise<Exchange> {
    const id = this.exchangeIdCounter++;
    const createdAt = new Date();
    const exchange: Exchange = { 
      id, 
      ...exchangeData, 
      status: 'pending', 
      createdAt, 
      updatedAt: createdAt 
    };
    this.exchanges.set(id, exchange);
    return exchange;
  }
  
  async updateExchangeStatus(id: number, status: string): Promise<Exchange | undefined> {
    const exchange = await this.getExchangeById(id);
    if (!exchange) return undefined;
    
    const updatedExchange = { 
      ...exchange, 
      status, 
      updatedAt: new Date() 
    };
    this.exchanges.set(id, updatedExchange);
    return updatedExchange;
  }
  
  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByExchangeId(exchangeId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.exchangeId === exchangeId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getUnreadMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const createdAt = new Date();
    const message: Message = { id, ...messageData, read: false, createdAt };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessageById(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

// Import the database storage implementation
import { DatabaseStorage } from './database-storage';

// Use the Database Storage implementation instead of MemStorage
export const storage = new DatabaseStorage();
