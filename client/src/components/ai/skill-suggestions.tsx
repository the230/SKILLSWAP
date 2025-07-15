import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAIServices } from "@/hooks/use-ai-services";

type SkillSuggestionsProps = {
  onSelectSkill?: (skill: string, type: "teaching" | "learning") => void;
};

export function SkillSuggestions({ onSelectSkill }: SkillSuggestionsProps) {
  const [currentTab, setCurrentTab] = useState<"teaching" | "learning">("teaching");
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Define trend data type
  type TrendData = {
    trending: string[];
    emerging: string[];
    inDemand: string[];
  };
  
  const { useSkillSuggestions, useSkillTrends } = useAIServices();
  const skillSuggestionsMutation = useSkillSuggestions();
  const { data: trends, isLoading: isTrendsLoading } = useSkillTrends<TrendData>();
  
  const handleGenerateSuggestions = async () => {
    if (!input.trim()) return;
    
    try {
      setSuggestions([]);
      const result = await skillSuggestionsMutation.mutateAsync({
        input,
        type: currentTab,
      });
      
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Failed to generate skill suggestions:", error);
    }
  };
  
  const handleSelectSkill = (skill: string) => {
    if (onSelectSkill) {
      onSelectSkill(skill, currentTab);
    }
  };
  
  const handleEnterPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerateSuggestions();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Skill Suggestions
        </CardTitle>
        <CardDescription>
          Get personalized skill suggestions based on your interests and experience
        </CardDescription>
      </CardHeader>
      
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "teaching" | "learning")}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teaching">Skills to Teach</TabsTrigger>
            <TabsTrigger value="learning">Skills to Learn</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="teaching" className="mt-4 space-y-4">
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Describe your experience, expertise, or what you enjoy doing:
                </p>
                <Textarea
                  placeholder="I have 5 years experience in software development, specializing in React and Node.js..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleEnterPress}
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleGenerateSuggestions}
                  disabled={!input.trim() || skillSuggestionsMutation.isPending}
                  className="w-full"
                >
                  {skillSuggestionsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Teaching Skill Suggestions
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="learning" className="mt-4 space-y-4">
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Describe what you're interested in learning or your goals:
                </p>
                <Textarea
                  placeholder="I'm interested in improving my data visualization skills and learning about AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleEnterPress}
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleGenerateSuggestions}
                  disabled={!input.trim() || skillSuggestionsMutation.isPending}
                  className="w-full"
                >
                  {skillSuggestionsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Learning Skill Suggestions
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-2" />
      
      <CardContent>
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Suggested Skills:</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill, index) => (
                <Badge 
                  key={index}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  variant="outline"
                  onClick={() => handleSelectSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {skillSuggestionsMutation.isPending && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {!skillSuggestionsMutation.isPending && suggestions.length === 0 && (
          <div className="py-4">
            <p className="text-center text-sm text-muted-foreground">
              {input.trim() 
                ? "Enter your interests or expertise and get personalized skill suggestions"
                : "No suggestions yet. Add some details about your interests or expertise to get started."}
            </p>
          </div>
        )}
      </CardContent>
      
      <Separator className="my-2" />
      
      <CardFooter className="block">
        <h3 className="text-sm font-medium mb-3">2025 Skill Trends:</h3>
        
        {isTrendsLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Trending</h4>
              <div className="flex flex-wrap gap-2">
                {(trends?.trending || []).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleSelectSkill(skill)}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Emerging</h4>
              <div className="flex flex-wrap gap-2">
                {(trends?.emerging || []).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleSelectSkill(skill)}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">In Demand</h4>
              <div className="flex flex-wrap gap-2">
                {(trends?.inDemand || []).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleSelectSkill(skill)}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}