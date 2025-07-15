import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useAIServices() {
  const { toast } = useToast();

  // Get skill trends (trending, emerging, in-demand)
  const useSkillTrends = <T = any>() => {
    return useQuery<T>({
      queryKey: ["/api/ai/skill-trends"],
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });
  };

  // Generate skill suggestions based on user input
  const useSkillSuggestions = () => {
    return useMutation({
      mutationFn: async ({ input, type }: { input: string; type: "teaching" | "learning" }) => {
        const res = await apiRequest("POST", "/api/ai/skill-suggestions", { input, type });
        return res.json();
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to get skill suggestions",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Generate description for a skill
  const useGenerateDescription = () => {
    return useMutation({
      mutationFn: async ({ title, type }: { title: string; type: "teaching" | "learning" }) => {
        const res = await apiRequest("POST", "/api/ai/generate-description", { title, type });
        return res.json();
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to generate description",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Suggest locations based on partial input
  const useSuggestLocations = () => {
    return useMutation({
      mutationFn: async (query: string) => {
        const res = await apiRequest("GET", `/api/ai/locations?q=${encodeURIComponent(query)}`);
        return res.json();
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to suggest locations",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Calculate match score between teaching and learning skills
  const useCalculateMatchScore = () => {
    return useMutation({
      mutationFn: async ({ 
        teachingSkill, 
        learningSkill 
      }: { 
        teachingSkill: string; 
        learningSkill: string 
      }) => {
        const res = await apiRequest("POST", "/api/ai/match-score", {
          teachingSkill,
          learningSkill,
        });
        return res.json();
      },
      onError: (error: Error) => {
        toast({
          title: "Failed to calculate match score",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return {
    useSkillTrends,
    useSkillSuggestions,
    useGenerateDescription,
    useSuggestLocations,
    useCalculateMatchScore,
  };
}