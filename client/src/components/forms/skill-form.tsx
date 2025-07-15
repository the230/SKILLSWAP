import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTeachingSkillSchema, insertLearningSkillSchema, Category } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles } from "lucide-react";

// Import AI components
import { SkillSuggestions, DescriptionGenerator, LocationAutocomplete } from "@/components/ai";

// Extended schemas with validation
const teachingSkillSchema = insertTeachingSkillSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const learningSkillSchema = insertLearningSkillSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type SkillFormProps = {
  type: "teaching" | "learning";
  onSuccess?: () => void;
  initialData?: any;
};

export function SkillForm({ type, onSuccess, initialData }: SkillFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "ai">("form");

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Use the appropriate schema based on skill type
  const skillSchema = type === "teaching" ? teachingSkillSchema : learningSkillSchema;
  
  // Setup the form
  const form = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      categoryId: undefined,
      userId: user?.id,
    },
  });
  
  // Handle skill suggestion selection
  const handleSelectSkill = (skill: string, skillType: "teaching" | "learning") => {
    if (skillType === type) {
      form.setValue("title", skill, { shouldValidate: true });
    }
  };
  
  // Handle description generation
  const handleGenerateDescription = (description: string) => {
    form.setValue("description", description, { shouldValidate: true });
  };

  // Create mutation for adding a new skill
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof skillSchema>) => {
      const endpoint = type === "teaching" ? "/api/teaching-skills" : "/api/learning-skills";
      const res = await apiRequest("POST", endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [type === "teaching" ? "/api/teaching-skills" : "/api/learning-skills"] });
      
      // Show success toast
      toast({
        title: "Skill Added",
        description: `Your ${type} skill has been added successfully.`,
      });
      
      // Reset form
      form.reset({
        title: "",
        description: "",
        categoryId: undefined,
        userId: user?.id,
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add skill: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation for editing an existing skill
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof skillSchema>) => {
      const endpoint = type === "teaching" 
        ? `/api/teaching-skills/${initialData.id}` 
        : `/api/learning-skills/${initialData.id}`;
      const res = await apiRequest("PUT", endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [type === "teaching" ? "/api/teaching-skills" : "/api/learning-skills"] });
      
      // Show success toast
      toast({
        title: "Skill Updated",
        description: `Your ${type} skill has been updated successfully.`,
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update skill: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof skillSchema>) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "ai")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Manual Form</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            AI Assisted
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder={`What ${type === "teaching" ? "can you teach" : "do you want to learn"}?`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`Describe your ${type === "teaching" ? "expertise" : "learning goals"} in detail...`} 
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2">Loading categories...</span>
                          </div>
                        ) : (
                          categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSubmitting || isLoadingCategories}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Skill" : "Add Skill"}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="ai" className="pt-4 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            {/* AI Skill Suggestions */}
            <SkillSuggestions onSelectSkill={handleSelectSkill} />
            
            {/* Description Generator (only show if a title is entered) */}
            {form.watch("title") && (
              <DescriptionGenerator 
                skillTitle={form.watch("title")} 
                type={type}
                onGenerate={handleGenerateDescription}
                initialDescription={form.watch("description")}
              />
            )}
            
            {/* Category selection */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Select a Category</h3>
              <Select 
                onValueChange={(value) => form.setValue("categoryId", parseInt(value), { shouldValidate: true })}
                value={form.watch("categoryId")?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading categories...</span>
                    </div>
                  ) : (
                    categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Submit Button */}
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || isLoadingCategories || !form.formState.isValid}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update Skill" : "Add Skill"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
