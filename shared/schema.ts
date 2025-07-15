import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  location: text("location"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  bio: true,
  location: true,
  avatar: true,
});

// Skill Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

// Skills users can teach
export const teachingSkills = pgTable("teaching_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeachingSkillSchema = createInsertSchema(teachingSkills).pick({
  userId: true,
  title: true,
  description: true,
  categoryId: true,
});

// Skills users want to learn
export const learningSkills = pgTable("learning_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLearningSkillSchema = createInsertSchema(learningSkills).pick({
  userId: true,
  title: true,
  description: true,
  categoryId: true,
});

// Skill exchange requests
export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  providerId: integer("provider_id").notNull(),
  requestedSkillId: integer("requested_skill_id").notNull(),
  offeredSkillId: integer("offered_skill_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertExchangeSchema = createInsertSchema(exchanges).pick({
  requesterId: true,
  providerId: true,
  requestedSkillId: true,
  offeredSkillId: true,
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  exchangeId: integer("exchange_id"),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  exchangeId: true,
  content: true,
});

// Type definitions for models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type TeachingSkill = typeof teachingSkills.$inferSelect;
export type InsertTeachingSkill = z.infer<typeof insertTeachingSkillSchema>;

export type LearningSkill = typeof learningSkills.$inferSelect;
export type InsertLearningSkill = z.infer<typeof insertLearningSkillSchema>;

export type Exchange = typeof exchanges.$inferSelect;
export type InsertExchange = z.infer<typeof insertExchangeSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
