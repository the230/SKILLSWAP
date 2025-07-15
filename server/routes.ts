import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer } from "ws";
import { insertTeachingSkillSchema, insertLearningSkillSchema, insertExchangeSchema, insertMessageSchema } from "@shared/schema";
import aiRoutes from "./ai-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup authentication routes
  setupAuth(app);
  
  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws', // Use a specific path to avoid conflicts with Vite's WebSocket
    perMessageDeflate: false, // Disable compression to avoid potential issues
  });
  
  // Track connected clients
  const clients = new Map();
  
  // Add error handling for WebSocket server
  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });
  
  wss.on("connection", (ws, req) => {
    // New connection
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    
    // Initialize with an unknown ID that will be set by the identify message
    let clientId = "unknown";
    
    // Send a welcome message to confirm connection
    try {
      ws.send(JSON.stringify({
        type: "system",
        message: "Connected to SkillSwap WebSocket server"
      }));
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
    
    ws.on("message", async (message) => {
      try {
        console.log('Received message from client:', clientId);
        const parsedMessage = JSON.parse(message.toString());
        console.log('Parsed message type:', parsedMessage.type);
        
        // Handle client identification
        if (parsedMessage.type === "identify") {
          const userId = parsedMessage.userId;
          
          if (userId) {
            // Remove the old reference if it exists
            if (clientId !== "unknown") {
              clients.delete(clientId);
            }
            
            clientId = userId.toString();
            clients.set(clientId, ws);
            console.log(`Client identified with user ID: ${clientId}`);
            
            // Confirm identification
            ws.send(JSON.stringify({
              type: "system",
              message: "Identification successful"
            }));
          }
        }
        // Handle chat messages
        else if (parsedMessage.type === "chat") {
          const { senderId, receiverId, content, exchangeId } = parsedMessage;
          console.log(`Chat message: from=${senderId} to=${receiverId}`);
          
          // Verify sender ID matches the identified client
          if (senderId && senderId.toString() === clientId) {
            const newMessage = await storage.createMessage({
              senderId,
              receiverId,
              content,
              exchangeId: exchangeId || null,
            });
            
            console.log('Message stored in database, ID:', newMessage.id);
            
            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: "system",
              message: "Message sent successfully",
              messageId: newMessage.id
            }));
            
            // Send to receiver if online
            const receiver = clients.get(receiverId.toString());
            if (receiver) {
              console.log('Sending message to recipient:', receiverId);
              receiver.send(JSON.stringify({
                type: "message",
                message: newMessage,
              }));
            } else {
              console.log('Recipient not connected:', receiverId);
            }
          } else {
            console.warn(`Message sender ID (${senderId}) doesn't match client ID (${clientId})`);
            ws.send(JSON.stringify({
              type: "error",
              message: "Sender ID doesn't match your identity"
            }));
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        // Send error back to client
        try {
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to process message"
          }));
        } catch (e) {
          console.error("Error sending error message to client:", e);
        }
      }
    });
    
    ws.on("error", (error) => {
      console.error('WebSocket client error:', error);
    });
    
    ws.on("close", (code, reason) => {
      console.log(`Client ${clientId} disconnected. Code: ${code}, Reason: ${reason}`);
      clients.delete(clientId);
    });
  });
  
  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Teaching Skills API
  app.get("/api/teaching-skills", async (req, res) => {
    try {
      const { userId, categoryId } = req.query;
      let skills;
      
      if (userId) {
        skills = await storage.getTeachingSkillsByUserId(Number(userId));
      } else if (categoryId) {
        skills = await storage.getTeachingSkillsByCategory(Number(categoryId));
      } else {
        skills = await storage.getTeachingSkills();
      }
      
      // Enrich skills with category and user info
      const enrichedSkills = await Promise.all(skills.map(async (skill) => {
        const category = await storage.getCategoryById(skill.categoryId);
        const user = await storage.getUser(skill.userId);
        return {
          ...skill,
          category,
          user: user ? { 
            id: user.id, 
            username: user.username, 
            name: user.name, 
            avatar: user.avatar,
            location: user.location 
          } : null,
        };
      }));
      
      res.json(enrichedSkills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teaching skills" });
    }
  });
  
  app.get("/api/teaching-skills/:id", async (req, res) => {
    try {
      const skill = await storage.getTeachingSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      const category = await storage.getCategoryById(skill.categoryId);
      const user = await storage.getUser(skill.userId);
      
      res.json({
        ...skill,
        category,
        user: user ? { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          avatar: user.avatar,
          location: user.location 
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teaching skill" });
    }
  });
  
  app.post("/api/teaching-skills", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate request body
      const validatedData = insertTeachingSkillSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const skill = await storage.createTeachingSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ message: "Invalid skill data", error });
    }
  });
  
  app.put("/api/teaching-skills/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const skill = await storage.getTeachingSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      if (skill.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedSkill = await storage.updateTeachingSkill(
        Number(req.params.id),
        req.body
      );
      
      res.json(updatedSkill);
    } catch (error) {
      res.status(400).json({ message: "Failed to update skill", error });
    }
  });
  
  app.delete("/api/teaching-skills/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const skill = await storage.getTeachingSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      if (skill.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteTeachingSkill(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });
  
  // Learning Skills API
  app.get("/api/learning-skills", async (req, res) => {
    try {
      const { userId, categoryId } = req.query;
      let skills;
      
      if (userId) {
        skills = await storage.getLearningSkillsByUserId(Number(userId));
      } else if (categoryId) {
        skills = await storage.getLearningSkillsByCategory(Number(categoryId));
      } else {
        skills = await storage.getLearningSkills();
      }
      
      // Enrich skills with category and user info
      const enrichedSkills = await Promise.all(skills.map(async (skill) => {
        const category = await storage.getCategoryById(skill.categoryId);
        const user = await storage.getUser(skill.userId);
        return {
          ...skill,
          category,
          user: user ? { 
            id: user.id, 
            username: user.username, 
            name: user.name, 
            avatar: user.avatar,
            location: user.location 
          } : null,
        };
      }));
      
      res.json(enrichedSkills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning skills" });
    }
  });
  
  app.get("/api/learning-skills/:id", async (req, res) => {
    try {
      const skill = await storage.getLearningSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      const category = await storage.getCategoryById(skill.categoryId);
      const user = await storage.getUser(skill.userId);
      
      res.json({
        ...skill,
        category,
        user: user ? { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          avatar: user.avatar,
          location: user.location
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning skill" });
    }
  });
  
  app.post("/api/learning-skills", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate request body
      const validatedData = insertLearningSkillSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const skill = await storage.createLearningSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ message: "Invalid skill data", error });
    }
  });
  
  app.put("/api/learning-skills/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const skill = await storage.getLearningSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      if (skill.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedSkill = await storage.updateLearningSkill(
        Number(req.params.id),
        req.body
      );
      
      res.json(updatedSkill);
    } catch (error) {
      res.status(400).json({ message: "Failed to update skill", error });
    }
  });
  
  app.delete("/api/learning-skills/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const skill = await storage.getLearningSkillById(Number(req.params.id));
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      if (skill.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteLearningSkill(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });
  
  // Exchanges API
  app.get("/api/exchanges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { status } = req.query;
      let exchanges;
      
      if (status) {
        // Get exchanges with specific status involving the current user
        const allStatusExchanges = await storage.getExchangesByStatus(status as string);
        exchanges = allStatusExchanges.filter(
          exchange => exchange.requesterId === req.user.id || exchange.providerId === req.user.id
        );
      } else {
        // Get all exchanges involving the current user
        exchanges = await storage.getExchangesByUserId(req.user.id);
      }
      
      // Enrich exchanges with related data
      const enrichedExchanges = await Promise.all(exchanges.map(async (exchange) => {
        const requester = await storage.getUser(exchange.requesterId);
        const provider = await storage.getUser(exchange.providerId);
        const requestedSkill = await storage.getTeachingSkillById(exchange.requestedSkillId);
        const offeredSkill = await storage.getTeachingSkillById(exchange.offeredSkillId);
        
        return {
          ...exchange,
          requester: requester ? { 
            id: requester.id, 
            username: requester.username, 
            name: requester.name, 
            avatar: requester.avatar 
          } : null,
          provider: provider ? { 
            id: provider.id, 
            username: provider.username, 
            name: provider.name, 
            avatar: provider.avatar 
          } : null,
          requestedSkill,
          offeredSkill
        };
      }));
      
      res.json(enrichedExchanges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exchanges" });
    }
  });
  
  app.get("/api/exchanges/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const exchange = await storage.getExchangeById(Number(req.params.id));
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      // Only allow participants to view the exchange
      if (exchange.requesterId !== req.user.id && exchange.providerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const requester = await storage.getUser(exchange.requesterId);
      const provider = await storage.getUser(exchange.providerId);
      const requestedSkill = await storage.getTeachingSkillById(exchange.requestedSkillId);
      const offeredSkill = await storage.getTeachingSkillById(exchange.offeredSkillId);
      
      res.json({
        ...exchange,
        requester: requester ? { 
          id: requester.id, 
          username: requester.username, 
          name: requester.name, 
          avatar: requester.avatar 
        } : null,
        provider: provider ? { 
          id: provider.id, 
          username: provider.username, 
          name: provider.name, 
          avatar: provider.avatar 
        } : null,
        requestedSkill,
        offeredSkill
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exchange" });
    }
  });
  
  app.post("/api/exchanges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate request body
      const validatedData = insertExchangeSchema.parse({
        ...req.body,
        requesterId: req.user.id
      });
      
      // Verify that the requested skill belongs to the provider
      const requestedSkill = await storage.getTeachingSkillById(validatedData.requestedSkillId);
      if (!requestedSkill || requestedSkill.userId !== validatedData.providerId) {
        return res.status(400).json({ message: "Invalid requested skill" });
      }
      
      // Verify that the offered skill belongs to the requester
      const offeredSkill = await storage.getTeachingSkillById(validatedData.offeredSkillId);
      if (!offeredSkill || offeredSkill.userId !== req.user.id) {
        return res.status(400).json({ message: "Invalid offered skill" });
      }
      
      const exchange = await storage.createExchange(validatedData);
      res.status(201).json(exchange);
    } catch (error) {
      res.status(400).json({ message: "Invalid exchange data", error });
    }
  });
  
  app.patch("/api/exchanges/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const exchange = await storage.getExchangeById(Number(req.params.id));
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      const { status } = req.body;
      
      if (!["pending", "accepted", "declined", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Only provider can accept/decline exchange requests
      if ((status === "accepted" || status === "declined") && exchange.providerId !== req.user.id) {
        return res.status(403).json({ message: "Only the provider can accept or decline exchanges" });
      }
      
      // Only participants can mark as completed
      if (status === "completed" && 
          exchange.requesterId !== req.user.id && 
          exchange.providerId !== req.user.id) {
        return res.status(403).json({ message: "Only participants can mark exchange as completed" });
      }
      
      const updatedExchange = await storage.updateExchangeStatus(
        Number(req.params.id),
        status
      );
      
      res.json(updatedExchange);
    } catch (error) {
      res.status(400).json({ message: "Failed to update exchange status", error });
    }
  });
  
  // Messages API
  app.get("/api/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { exchangeId, otherUserId } = req.query;
      let messages;
      
      if (exchangeId) {
        const exchange = await storage.getExchangeById(Number(exchangeId));
        
        if (!exchange) {
          return res.status(404).json({ message: "Exchange not found" });
        }
        
        // Only participants can view messages
        if (exchange.requesterId !== req.user.id && exchange.providerId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        messages = await storage.getMessagesByExchangeId(Number(exchangeId));
      } else if (otherUserId) {
        messages = await storage.getMessagesBetweenUsers(req.user.id, Number(otherUserId));
      } else {
        return res.status(400).json({ message: "Either exchangeId or otherUserId is required" });
      }
      
      // Enrich messages with sender info
      const enrichedMessages = await Promise.all(messages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? { 
            id: sender.id, 
            username: sender.username, 
            name: sender.name, 
            avatar: sender.avatar 
          } : null,
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate request body
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      // If exchange ID is provided, verify the user is a participant
      if (validatedData.exchangeId) {
        const exchange = await storage.getExchangeById(validatedData.exchangeId);
        
        if (!exchange) {
          return res.status(404).json({ message: "Exchange not found" });
        }
        
        if (exchange.requesterId !== req.user.id && exchange.providerId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const message = await storage.createMessage(validatedData);
      
      // Enrich with sender info
      const sender = await storage.getUser(message.senderId);
      const enrichedMessage = {
        ...message,
        sender: sender ? { 
          id: sender.id, 
          username: sender.username, 
          name: sender.name, 
          avatar: sender.avatar 
        } : null,
      };
      
      res.status(201).json(enrichedMessage);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data", error });
    }
  });
  
  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const message = await storage.getMessageById(Number(req.params.id));
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only the receiver can mark as read
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Only the receiver can mark message as read" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(Number(req.params.id));
      res.json(updatedMessage);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark message as read", error });
    }
  });
  
  app.get("/api/messages/unread", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const unreadMessages = await storage.getUnreadMessagesByUserId(req.user.id);
      res.json(unreadMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread messages" });
    }
  });
  
  // User profile API
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without sensitive information
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.patch("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Don't allow updating username, email, or password through this endpoint
      const { username, email, password, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile", error });
    }
  });
  
  // Register AI routes
  app.use(aiRoutes);
  
  return httpServer;
}
