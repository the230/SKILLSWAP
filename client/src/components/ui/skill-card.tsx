import { Category, TeachingSkill, LearningSkill } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Book,
  Code,
  Utensils,
  Music,
  PiggyBank,
  Video,
  Languages,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Scissors,
  Tag
} from "lucide-react";
import { format } from "date-fns";

interface SkillCardProps {
  skill: (TeachingSkill | LearningSkill) & {
    category?: Category;
    user?: {
      id: number;
      username: string;
      name: string;
      avatar?: string;
      location?: string;
    };
  };
  type: "teaching" | "learning";
  onClick?: () => void;
  showInterest?: boolean;
  interestCount?: number;
}

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName?.toLowerCase()) {
    case "programming":
      return <Code className="h-6 w-6" />;
    case "music":
      return <Music className="h-6 w-6" />;
    case "cooking":
      return <Utensils className="h-6 w-6" />;
    case "art":
      return <Scissors className="h-6 w-6" />;
    case "finance":
      return <PiggyBank className="h-6 w-6" />;
    case "media":
      return <Video className="h-6 w-6" />;
    case "languages":
      return <Languages className="h-6 w-6" />;
    case "sports":
      return <Dumbbell className="h-6 w-6" />;
    case "academics":
      return <GraduationCap className="h-6 w-6" />;
    case "professional":
      return <Briefcase className="h-6 w-6" />;
    default:
      return <Book className="h-6 w-6" />;
  }
};

const getBgColorClass = (type: "teaching" | "learning", categoryName: string) => {
  const categoryColorMap: Record<string, string> = {
    "programming": "bg-primary-100 text-primary-700",
    "music": "bg-secondary-100 text-secondary-700",
    "cooking": "bg-red-100 text-red-700",
    "art": "bg-purple-100 text-purple-700",
    "finance": "bg-blue-100 text-blue-700",
    "media": "bg-yellow-100 text-yellow-700",
    "languages": "bg-orange-100 text-orange-700",
    "sports": "bg-lime-100 text-lime-700",
    "academics": "bg-emerald-100 text-emerald-700",
    "professional": "bg-indigo-100 text-indigo-700",
    "crafts": "bg-pink-100 text-pink-700",
  };
  
  const category = categoryName?.toLowerCase();
  if (category && categoryColorMap[category]) {
    return categoryColorMap[category];
  }
  
  return type === "teaching" 
    ? "bg-primary-100 text-primary-700" 
    : "bg-secondary-100 text-secondary-700";
};

export function SkillCard({ skill, type, onClick, showInterest = false, interestCount = 0 }: SkillCardProps) {
  return (
    <Card className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onClick}>
      <CardContent className="p-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`rounded-md p-2 ${getBgColorClass(type, skill.category?.name || '')}`}>
              {getCategoryIcon(skill.category?.name || '')}
            </div>
            <p className="ml-3 text-sm font-medium text-gray-900">{skill.title}</p>
          </div>
          {showInterest && (
            <div className="ml-2 flex-shrink-0 flex">
              <Badge variant="outline" className={type === "teaching" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {type === "teaching" ? `${interestCount} interested` : `${interestCount} teachers`}
              </Badge>
            </div>
          )}
        </div>
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex">
            <p className="flex items-center text-sm text-gray-500">
              <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {skill.category?.name || 'Uncategorized'}
            </p>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
            <p>
              Added on {skill.createdAt ? format(new Date(skill.createdAt), 'MMM d, yyyy') : 'Unknown date'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
