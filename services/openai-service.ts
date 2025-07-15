import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSkillSuggestions(
  userInput: string,
  type: "teaching" | "learning"
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are an AI assistant for a skill exchange platform called SkillSwap. 
             The year is 2025. You help users identify and articulate skills they can ${type === "teaching" ? "teach to" : "learn from"} others.
             Based on the user's input, suggest 5 relevant and specific skills that would be valuable in 2025.
             Focus on both traditional skills and emerging skills that are becoming important due to technological and societal changes.
             Respond with ONLY a JSON object containing an array named "skills" with 5 strings, each representing a skill.`
        },
        {
          role: "user",
          content: userInput
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"skills":[]}';
    const suggestedSkills = JSON.parse(content);
    return suggestedSkills.skills || [];
  } catch (error) {
    console.error("Error generating skill suggestions:", error);
    return [];
  }
}

export async function generateSkillDescription(
  skillTitle: string,
  type: "teaching" | "learning"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are an AI assistant for a skill exchange platform. 
             Generate a professional and engaging description for a skill that someone wants to ${type === "teaching" ? "teach" : "learn"}.
             The description should be 2-3 sentences, highlighting the value and relevance of this skill in 2025.
             It should be informative but concise, written in first person.
             For teaching: emphasize expertise and teaching approach.
             For learning: emphasize learning goals and motivation.`
        },
        {
          role: "user",
          content: skillTitle
        }
      ]
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating skill description:", error);
    return "";
  }
}

export async function suggestLocation(partialInput: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are a location suggestion service. 
             Given a partial input of a city or location name, return the top 5 likely completions.
             These should be real locations from around the world.
             Respond with ONLY a JSON object containing an array named "locations" with 5 strings, each representing a location.`
        },
        {
          role: "user",
          content: partialInput
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"locations":[]}';
    const suggestions = JSON.parse(content);
    return suggestions.locations || [];
  } catch (error) {
    console.error("Error suggesting locations:", error);
    return [];
  }
}

export async function analyzeSkillTrends(): Promise<{
  trending: string[];
  emerging: string[];
  inDemand: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are an AI trend analyst for a skill exchange platform.
             The year is 2025. Provide an analysis of current skill trends in the following categories:
             1. Trending skills (currently popular)
             2. Emerging skills (new and growing in importance)
             3. In-demand skills (high market value)
             Focus on both technical and non-technical skills.
             Respond with ONLY a JSON object with three arrays: "trending", "emerging", and "inDemand", each containing 5 skill names.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"trending":[],"emerging":[],"inDemand":[]}';
    const trends = JSON.parse(content);
    return {
      trending: trends.trending || [],
      emerging: trends.emerging || [],
      inDemand: trends.inDemand || []
    };
  } catch (error) {
    console.error("Error analyzing skill trends:", error);
    return { trending: [], emerging: [], inDemand: [] };
  }
}

export async function generateMatchScore(
  teachingSkill: string,
  learningSkill: string
): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are an AI compatibility analyzer for a skill exchange platform.
             You evaluate how well a teaching skill and learning skill match.
             Return a compatibility score between 0 and 100:
             - 90-100: Perfect match, highly related skills
             - 70-89: Strong match, related skills
             - 50-69: Moderate match, somewhat related
             - 30-49: Weak match, marginally related
             - 0-29: Poor match, unrelated skills
             Respond with ONLY a JSON object containing a single "score" property with a number value.`
        },
        {
          role: "user",
          content: `Teaching skill: ${teachingSkill}\nLearning skill: ${learningSkill}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"score":50}';
    const result = JSON.parse(content);
    return Math.min(100, Math.max(0, result.score || 50));
  } catch (error) {
    console.error("Error generating match score:", error);
    return 50; // Default moderate score
  }
}