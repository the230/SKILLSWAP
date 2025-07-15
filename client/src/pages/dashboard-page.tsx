import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Book,
  LightbulbIcon,
  MessageCircle,
  BadgeIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SkillCard } from "@/components/ui/skill-card";
import { StatCard } from "@/components/ui/stat-card";
import { SkillForm } from "@/components/forms/skill-form";
import {
  TeachingSkill,
  LearningSkill,
  Exchange
} from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [skillType, setSkillType] = useState<"teaching" | "learning">("teaching");

  // Fetch teaching skills
  const { data: teachingSkills = [], isLoading: isLoadingTeaching } = useQuery<TeachingSkill[]>({
    queryKey: ["/api/teaching-skills", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch learning skills
  const { data: learningSkills = [], isLoading: isLoadingLearning } = useQuery<LearningSkill[]>({
    queryKey: ["/api/learning-skills", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch exchanges
  const { data: exchanges = [], isLoading: isLoadingExchanges } = useQuery<Exchange[]>({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
  });

  // Fetch unread messages count
  const { data: unreadMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages/unread"],
    enabled: !!user,
  });

  const handleAddSkill = (type: "teaching" | "learning") => {
    setSkillType(type);
    setShowAddSkillModal(true);
  };

  const pendingExchanges = exchanges.filter(exchange => exchange.status === "pending");
  const activeExchanges = exchanges.filter(exchange => exchange.status === "accepted");
  const completedExchanges = exchanges.filter(exchange => exchange.status === "completed");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-gray-100 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Dashboard header */}
            <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-2xl leading-6 font-heading font-bold text-gray-900">
                My Dashboard
              </h3>
              <div className="mt-3 sm:mt-0 sm:ml-4">
                <Dialog open={showAddSkillModal} onOpenChange={setShowAddSkillModal}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add new skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {skillType === "teaching" ? "Add a Skill to Teach" : "Add a Skill to Learn"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="flex space-x-4 mb-6">
                        <Button 
                          variant={skillType === "teaching" ? "default" : "outline"}
                          onClick={() => setSkillType("teaching")}
                          className="flex-1"
                        >
                          I can teach
                        </Button>
                        <Button 
                          variant={skillType === "learning" ? "default" : "outline"}
                          onClick={() => setSkillType("learning")}
                          className="flex-1"
                        >
                          I want to learn
                        </Button>
                      </div>
                      <SkillForm 
                        type={skillType} 
                        onSuccess={() => setShowAddSkillModal(false)} 
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Stats cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                title="Skills I Can Teach" 
                value={teachingSkills.length.toString()} 
                bgColor="bg-primary-500" 
                icon={<Book className="h-6 w-6 text-white" />} 
              />
              
              <StatCard 
                title="Skills I Want to Learn" 
                value={learningSkills.length.toString()} 
                bgColor="bg-secondary-500" 
                icon={<LightbulbIcon className="h-6 w-6 text-white" />} 
              />
              
              <StatCard 
                title="Active Exchanges" 
                value={activeExchanges.length.toString()} 
                bgColor="bg-purple-500" 
                icon={<BadgeIcon className="h-6 w-6 text-white" />} 
              />
              
              <StatCard 
                title="Unread Messages" 
                value={unreadMessages.length.toString()} 
                bgColor="bg-yellow-500" 
                icon={<MessageCircle className="h-6 w-6 text-white" />} 
              />
            </div>

            {/* Skills section */}
            <div className="mt-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Skills I can teach */}
                <div className="md:w-1/2">
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Skills I Can Teach
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          These are the skills you've offered to share with others.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddSkill("teaching")}
                      >
                        Add
                      </Button>
                    </div>
                    {teachingSkills.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <p>You haven't added any teaching skills yet.</p>
                        <Button 
                          variant="link" 
                          onClick={() => handleAddSkill("teaching")}
                        >
                          Add your first skill to teach
                        </Button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {teachingSkills.map((skill) => (
                          <li key={skill.id}>
                            <SkillCard 
                              skill={skill} 
                              type="teaching" 
                              showInterest={true}
                              interestCount={Math.floor(Math.random() * 10)} // This would be real data in a production app
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Skills I want to learn */}
                <div className="md:w-1/2 mt-4 md:mt-0">
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Skills I Want to Learn
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          These are the skills you're interested in learning.
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddSkill("learning")}
                      >
                        Add
                      </Button>
                    </div>
                    {learningSkills.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <p>You haven't added any learning skills yet.</p>
                        <Button 
                          variant="link" 
                          onClick={() => handleAddSkill("learning")}
                        >
                          Add your first skill to learn
                        </Button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {learningSkills.map((skill) => (
                          <li key={skill.id}>
                            <SkillCard 
                              skill={skill} 
                              type="learning" 
                              showInterest={true}
                              interestCount={Math.floor(Math.random() * 10)} // This would be real data in a production app
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent exchanges */}
            <div className="mt-8">
              <div className="pb-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Exchanges
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your recent and ongoing skill exchanges.
                </p>
              </div>
              
              {exchanges.length === 0 ? (
                <div className="mt-4 bg-white p-6 shadow rounded-lg text-center">
                  <p className="text-gray-500 mb-4">You don't have any skill exchanges yet.</p>
                  <Link href="/explore">
                    <Button>Browse skills to start an exchange</Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Exchange Partner</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Skill Taught</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Skill Learned</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {exchanges.map((exchange) => {
                        const isRequester = exchange.requesterId === user?.id;
                        const partner = isRequester ? exchange.provider : exchange.requester;
                        const taughtSkill = isRequester ? exchange.offeredSkill : exchange.requestedSkill;
                        const learnedSkill = isRequester ? exchange.requestedSkill : exchange.offeredSkill;
                        
                        let statusBadgeClass = "";
                        switch(exchange.status) {
                          case "pending":
                            statusBadgeClass = "bg-yellow-100 text-yellow-800";
                            break;
                          case "accepted":
                            statusBadgeClass = "bg-green-100 text-green-800";
                            break;
                          case "declined":
                            statusBadgeClass = "bg-red-100 text-red-800";
                            break;
                          case "completed":
                            statusBadgeClass = "bg-gray-100 text-gray-800";
                            break;
                        }

                        return (
                          <tr key={exchange.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {partner?.avatar ? (
                                    <img className="h-10 w-10 rounded-full" src={partner.avatar} alt={`${partner.name}'s avatar`} />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                      {partner?.name?.[0] || '?'}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">{partner?.name}</div>
                                  <div className="text-gray-500">{partner?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <Badge className="bg-primary-100 text-primary-800">
                                {taughtSkill?.title || "Unknown skill"}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <Badge className="bg-secondary-100 text-secondary-800">
                                {learnedSkill?.title || "Unknown skill"}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <Badge className={statusBadgeClass}>
                                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link href={`/messages?exchangeId=${exchange.id}`}>
                                <a className="text-primary-600 hover:text-primary-900">
                                  View<span className="sr-only">, exchange with {partner?.name}</span>
                                </a>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
