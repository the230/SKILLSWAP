import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, User as UserIcon, MapPin, Mail, AtSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkillCard } from "@/components/ui/skill-card";

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user's teaching skills
  const { data: teachingSkills = [], isLoading: isLoadingTeaching } = useQuery({
    queryKey: ["/api/teaching-skills", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch user's learning skills
  const { data: learningSkills = [], isLoading: isLoadingLearning } = useQuery({
    queryKey: ["/api/learning-skills", { userId: user?.id }],
    enabled: !!user,
  });

  // Setup form with user data
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      avatar: user?.avatar || "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      queryClient.setQueryData(["/api/user"], {
        ...user,
        ...updatedUser,
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(values);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white shadow">
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <Avatar className="h-24 w-24 border-4 border-white shadow">
                    <AvatarImage src={user.avatar || undefined} alt={user.name || user.username} />
                    <AvatarFallback className="text-3xl">
                      {user.name?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-3 md:mt-0 md:ml-6">
                    <CardTitle className="text-3xl font-heading">{user.name || user.username}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <AtSign className="h-3 w-3" />
                        {user.username}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </Badge>
                      {user.location && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsEditing(!isEditing)} 
                  variant="outline"
                  className="mt-4 md:mt-0"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell others about yourself..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Share a bit about your background, interests, and expertise.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="avatar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for your profile picture.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div>
                  <h3 className="font-medium text-lg">About</h3>
                  <p className="mt-2 text-gray-600">
                    {user.bio || "No bio provided yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Skills Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="teaching" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teaching">Skills I Can Teach</TabsTrigger>
                <TabsTrigger value="learning">Skills I Want to Learn</TabsTrigger>
              </TabsList>
              
              {/* Teaching Skills Tab */}
              <TabsContent value="teaching" className="mt-4">
                {isLoadingTeaching ? (
                  <Card>
                    <CardContent className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    </CardContent>
                  </Card>
                ) : teachingSkills.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-gray-600 mb-2">No teaching skills added yet</h3>
                      <Button 
                        variant="link" 
                        onClick={() => window.location.href = "/dashboard"}
                      >
                        Add skills from your dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {teachingSkills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        type="teaching"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Learning Skills Tab */}
              <TabsContent value="learning" className="mt-4">
                {isLoadingLearning ? (
                  <Card>
                    <CardContent className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    </CardContent>
                  </Card>
                ) : learningSkills.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-gray-600 mb-2">No learning skills added yet</h3>
                      <Button 
                        variant="link" 
                        onClick={() => window.location.href = "/dashboard"}
                      >
                        Add skills from your dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {learningSkills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        type="learning"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
