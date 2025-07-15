import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap } from "lucide-react";
import { useAIServices } from "@/hooks/use-ai-services";

type MatchScoreProps = {
  teachingSkill: string;
  learningSkill: string;
  className?: string;
};

export function MatchScore({
  teachingSkill,
  learningSkill,
  className = "",
}: MatchScoreProps) {
  const [score, setScore] = useState<number | null>(null);
  const { useCalculateMatchScore } = useAIServices();
  const calculateScoreMutation = useCalculateMatchScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getScoreText = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
  };
  
  const handleCalculateScore = async () => {
    if (!teachingSkill || !learningSkill) return;
    
    try {
      const result = await calculateScoreMutation.mutateAsync({
        teachingSkill,
        learningSkill,
      });
      
      setScore(result.score);
    } catch (error) {
      console.error("Failed to calculate match score:", error);
    }
  };
  
  // Calculate score when both skills change
  useEffect(() => {
    if (teachingSkill && learningSkill) {
      setScore(null);
      handleCalculateScore();
    } else {
      setScore(null);
    }
  }, [teachingSkill, learningSkill]);
  
  if (!teachingSkill || !learningSkill) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Skill Match Analysis
        </CardTitle>
        <CardDescription>
          AI-powered compatibility score between these skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Teaching:</p>
              <p className="font-medium truncate">{teachingSkill}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Learning:</p>
              <p className="font-medium truncate">{learningSkill}</p>
            </div>
          </div>
          
          {calculateScoreMutation.isPending && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {!calculateScoreMutation.isPending && score !== null && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium">{getScoreText(score)}</p>
                <p className="text-lg font-semibold">{score}%</p>
              </div>
              <Progress value={score} className={`h-3 ${getScoreColor(score)}`} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          onClick={handleCalculateScore}
          disabled={!teachingSkill || !learningSkill || calculateScoreMutation.isPending}
          className="w-full"
        >
          {calculateScoreMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {score !== null ? "Recalculate Match" : "Calculate Match Score"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}