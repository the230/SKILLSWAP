import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  TeachingSkill,
  LearningSkill,
  Category
} from "@shared/schema";

export default function ExplorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewType, setViewType] = useState<"teaching" | "learning">("teaching");
  const [selectedSkill, setSelectedSkill] = useState<TeachingSkill | null>(null);
  const [selectedOwnSkill, setSelectedOwnSkill] = useState<number | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // Fetch all teaching skills excluding current user's
  const { data: teachingSkills = [], isLoading: isLoadingTeaching } = useQuery<TeachingSkill[]>({
    queryKey: ["/api/teaching-skills"],
    enabled: !!user,
  });

  // Fetch current user's teaching skills (for exchange offers)
  const { data: myTeachingSkills = [], isLoading: isLoadingMyTeaching } = useQuery<TeachingSkill[]>({
    queryKey: ["/api/teaching-skills", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch all learning skills excluding current user's
  const { data: learningSkills = [], isLoading: isLoadingLearning } = useQuery<LearningSkill[]>({
    queryKey: ["/api/learning-skills"],
    enabled: !!user,
  });

  // Fetch categories for filtering
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Filter skills based on search term and category
  const filteredSkills = viewType === "teaching"
    ? teachingSkills.filter(skill => 
        skill.userId !== user?.id && // Exclude current user's skills
        (searchTerm === "" || 
          skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === "all" || skill.categoryId.toString() === categoryFilter)
      )
    : learningSkills.filter(skill => 
        skill.userId !== user?.id && // Exclude current user's skills
        (searchTerm === "" || 
          skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skill.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === "all" || skill.categoryId.toString() === categoryFilter)
      );

  // Create exchange request
  const createExchange = async () => {
    if (!selectedSkill || !selectedOwnSkill) {
      toast({
        title: "Error",
        description: "Please select both skills for exchange",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/exchanges", {
        providerId: selectedSkill.userId,
        requestedSkillId: selectedSkill.id,
        offeredSkillId: selectedOwnSkill,
      });
      
      toast({
        title: "Exchange Requested",
        description: "Your skill exchange request has been sent!",
      });
      
      setShowExchangeModal(false);
      setSelectedSkill(null);
      setSelectedOwnSkill(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exchange request",
        variant: "destructive",
      });
    }
  };

  // Function to initiate an exchange
  const initiateExchange = (skill: TeachingSkill) => {
    if (myTeachingSkills.length === 0) {
      toast({
        title: "No skills to offer",
        description: "You need to add skills you can teach before requesting an exchange.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSkill(skill);
    setShowExchangeModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-gray-100 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="pb-5 border-b border-gray-200">
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                Explore Skills
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Discover skills others are offering and find your next learning opportunity
              </p>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mt-6 bg-white p-4 shadow rounded-lg">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    className="pl-10" 
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-60">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant={viewType === "teaching" ? "default" : "outline"}
                    onClick={() => setViewType("teaching")}
                  >
                    Available to Teach
                  </Button>
                  <Button
                    variant={viewType === "learning" ? "default" : "outline"}
                    onClick={() => setViewType("learning")}
                  >
                    Wanted to Learn
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Skills Grid */}
            {isLoadingTeaching || isLoadingLearning ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-600">Loading skills...</span>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="mt-8 text-center p-8 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">No skills found</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm || categoryFilter 
                    ? "Try adjusting your search or filter criteria."
                    : `No one is ${viewType === "teaching" ? "offering to teach" : "looking to learn"} at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.map((skill) => (
                  <Card key={skill.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{skill.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-500">
                            {categories.find(c => c.id === skill.categoryId)?.name || "Uncategorized"}
                          </CardDescription>
                        </div>
                        {skill.user?.avatar ? (
                          <Avatar>
                            <AvatarImage src={skill.user.avatar} alt={skill.user?.name || "User"} />
                            <AvatarFallback>
                              {(skill.user?.name || skill.user?.username || "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar>
                            <AvatarFallback>
                              {(skill.user?.name || skill.user?.username || "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {skill.description}
                      </p>
                      <div className="mt-4">
                        <Badge variant="outline" className="text-xs">
                          {skill.user?.name || skill.user?.username} • {skill.user?.location || "Location not specified"}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 pt-4">
                      {viewType === "teaching" ? (
                        <Button 
                          className="w-full" 
                          onClick={() => initiateExchange(skill as TeachingSkill)}
                        >
                          Request Exchange
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full">
                          I Can Teach This
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Exchange Request Modal */}
        <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Skill Exchange</DialogTitle>
              <DialogDescription>
                Select one of your skills to offer in exchange for "{selectedSkill?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">You will learn:</h4>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{selectedSkill?.title}</div>
                  <div className="text-sm text-gray-500">from {selectedSkill?.user?.name}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">You will teach:</h4>
                {isLoadingMyTeaching ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <Select onValueChange={(value) => setSelectedOwnSkill(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select one of your skills" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTeachingSkills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          {skill.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowExchangeModal(false)}>
                Cancel
              </Button>
              <Button onClick={createExchange}>
                Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
