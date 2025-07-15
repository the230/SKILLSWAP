import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useAIServices } from "@/hooks/use-ai-services";

type DescriptionGeneratorProps = {
  skillTitle: string;
  type: "teaching" | "learning";
  onGenerate: (description: string) => void;
  initialDescription?: string;
};

export function DescriptionGenerator({
  skillTitle,
  type,
  onGenerate,
  initialDescription = "",
}: DescriptionGeneratorProps) {
  const [description, setDescription] = useState(initialDescription);
  const { useGenerateDescription } = useAIServices();
  const generateDescriptionMutation = useGenerateDescription();
  
  const handleGenerateDescription = async () => {
    if (!skillTitle.trim()) return;
    
    try {
      const result = await generateDescriptionMutation.mutateAsync({
        title: skillTitle,
        type,
      });
      
      const generatedDescription = result.description || "";
      setDescription(generatedDescription);
      onGenerate(generatedDescription);
    } catch (error) {
      console.error("Failed to generate description:", error);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Generated Description
          </CardTitle>
          <CardDescription>
            Create a professional description for "{skillTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={`Your ${type === "teaching" ? "teaching" : "learning"} skill description will appear here...`}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onGenerate(e.target.value);
            }}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={handleGenerateDescription}
            disabled={!skillTitle.trim() || generateDescriptionMutation.isPending}
            className="w-full"
          >
            {generateDescriptionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Description
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Tip: You can edit the generated description to personalize it further.
      </p>
    </div>
  );
}