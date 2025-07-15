import { Router } from "express";
import {
  generateSkillSuggestions,
  generateSkillDescription,
  suggestLocation,
  analyzeSkillTrends,
  generateMatchScore
} from "./services/openai-service";

const router = Router();

// Get skill suggestions based on user input
router.post("/api/ai/skill-suggestions", async (req, res) => {
  try {
    const { input, type } = req.body;
    
    if (!input || !type || (type !== "teaching" && type !== "learning")) {
      return res.status(400).json({ 
        error: "Invalid request. Required parameters: input (string) and type ('teaching' or 'learning')" 
      });
    }
    
    const suggestions = await generateSkillSuggestions(input, type);
    res.json({ suggestions });
  } catch (error) {
    console.error("Error in skill suggestions API:", error);
    res.status(500).json({ error: "Failed to generate skill suggestions" });
  }
});

// Generate skill description based on title
router.post("/api/ai/generate-description", async (req, res) => {
  try {
    const { title, type } = req.body;
    
    if (!title || !type || (type !== "teaching" && type !== "learning")) {
      return res.status(400).json({ 
        error: "Invalid request. Required parameters: title (string) and type ('teaching' or 'learning')" 
      });
    }
    
    const description = await generateSkillDescription(title, type);
    res.json({ description });
  } catch (error) {
    console.error("Error in description generation API:", error);
    res.status(500).json({ error: "Failed to generate skill description" });
  }
});

// Get location suggestions based on partial input
router.get("/api/ai/locations", async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: "Query parameter 'q' must be provided and have at least 2 characters" 
      });
    }
    
    const locations = await suggestLocation(query);
    res.json({ locations });
  } catch (error) {
    console.error("Error in location suggestions API:", error);
    res.status(500).json({ error: "Failed to suggest locations" });
  }
});

// Get skill trends
router.get("/api/ai/skill-trends", async (req, res) => {
  try {
    const trends = await analyzeSkillTrends();
    res.json(trends);
  } catch (error) {
    console.error("Error in skill trends API:", error);
    res.status(500).json({ error: "Failed to analyze skill trends" });
  }
});

// Calculate skill match score
router.post("/api/ai/match-score", async (req, res) => {
  try {
    const { teachingSkill, learningSkill } = req.body;
    
    if (!teachingSkill || !learningSkill) {
      return res.status(400).json({ 
        error: "Both teachingSkill and learningSkill must be provided" 
      });
    }
    
    const score = await generateMatchScore(teachingSkill, learningSkill);
    res.json({ score });
  } catch (error) {
    console.error("Error in match score API:", error);
    res.status(500).json({ error: "Failed to generate match score" });
  }
});

export default router;