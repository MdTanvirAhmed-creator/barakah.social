"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Upload,
  MessageCircle,
  Calendar,
  BarChart3,
  Users,
  FileText,
  Video,
  Headphones,
  Image,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Share,
  Star,
  TrendingUp,
  Award,
  Target,
  Globe,
  Clock3,
  UserCheck,
  MessageSquare,
  ThumbsUp,
  Heart,
  Bookmark,
  Filter,
  Search,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ScholarContent {
  id: string;
  title: string;
  type: "article" | "video" | "audio" | "image" | "document";
  category: string;
  status: "draft" | "published" | "under_review" | "rejected";
  views: number;
  likes: number;
  comments: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  description: string;
  file_url?: string;
  thumbnail_url?: string;
}

interface CommunityQuestion {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "answered" | "under_review";
  asked_by: {
    name: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  tags: string[];
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration: number; // in minutes
  max_participants: number;
  current_participants: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  meeting_url?: string;
}

const CONTENT_TYPES = {
  article: { icon: FileText, label: "Article", color: "text-blue-600" },
  video: { icon: Video, label: "Video", color: "text-red-600" },
  audio: { icon: Headphones, label: "Audio", color: "text-green-600" },
  image: { icon: Image, label: "Image", color: "text-purple-600" },
  document: { icon: FileText, label: "Document", color: "text-gray-600" },
};

export default function ScholarPortalPage() {
  const [activeTab, setActiveTab] = useState<"content" | "questions" | "sessions" | "analytics">("content");
  const [content, setContent] = useState<ScholarContent[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadScholarData();
  }, []);

  const loadScholarData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockContent: ScholarContent[] = [
        {
          id: "1",
          title: "Understanding the Five Pillars of Islam",
          type: "article",
          category: "Aqeedah",
          status: "published",
          views: 1250,
          likes: 89,
          comments: 23,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ["Aqeedah", "Pillars", "Basics"],
          description: "A comprehensive guide to the fundamental pillars of Islamic faith",
        },
        {
          id: "2",
          title: "Tajweed Rules for Beginners",
          type: "video",
          category: "Quran",
          status: "published",
          views: 2100,
          likes: 156,
          comments: 45,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ["Tajweed", "Quran", "Recitation"],
          description: "Step-by-step video tutorial on proper Quran recitation",
          thumbnail_url: "/thumbnails/tajweed.jpg",
        },
        {
          id: "3",
          title: "The Life of Prophet Muhammad (PBUH)",
          type: "document",
          category: "Seerah",
          status: "draft",
          views: 0,
          likes: 0,
          comments: 0,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ["Seerah", "Prophet", "History"],
          description: "Comprehensive biography of the Prophet's life and teachings",
        },
      ];

      const mockQuestions: CommunityQuestion[] = [
        {
          id: "1",
          title: "What is the ruling on combining prayers while traveling?",
          content: "I'm going on a business trip and will be traveling for 3 days. Can I combine my prayers? What are the conditions?",
          category: "Fiqh",
          priority: "high",
          status: "pending",
          asked_by: {
            name: "Ahmad Hassan",
            username: "ahmad_hassan",
            avatar_url: undefined,
          },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tags: ["Prayer", "Travel", "Fiqh"],
        },
        {
          id: "2",
          title: "How to properly perform Wudu?",
          content: "I'm new to Islam and want to learn the correct way to perform ablution. Can you provide a detailed explanation?",
          category: "Fiqh",
          priority: "medium",
          status: "answered",
          asked_by: {
            name: "Fatima Ali",
            username: "fatima_ali",
            avatar_url: undefined,
          },
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          tags: ["Wudu", "Ablution", "Basics"],
        },
      ];

      const mockSessions: LiveSession[] = [
        {
          id: "1",
          title: "Weekly Quran Study Circle",
          description: "Join us for a deep dive into Surah Al-Fatiha and its meanings",
          scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          max_participants: 50,
          current_participants: 23,
          status: "scheduled",
        },
        {
          id: "2",
          title: "Hadith Discussion: Sahih Bukhari",
          description: "Exploring authentic hadiths and their practical applications",
          scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          max_participants: 30,
          current_participants: 18,
          status: "scheduled",
        },
      ];

      setContent(mockContent);
      setQuestions(mockQuestions);
      setSessions(mockSessions);
    } catch (error) {
      console.error("Error loading scholar data:", error);
      toast.error("Failed to load scholar data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "text-green-600 bg-green-50 border-green-200";
      case "draft": return "text-gray-600 bg-gray-50 border-gray-200";
      case "under_review": return "text-blue-600 bg-blue-50 border-blue-200";
      case "rejected": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Scholar Portal
              </h1>
              <p className="text-muted-foreground">
                Manage your content, answer questions, and engage with the community
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
              <Button
                onClick={() => setShowSessionModal(true)}
                variant="outline"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            {[
              { id: "content", label: "My Content", icon: BookOpen },
              { id: "questions", label: "Questions", icon: MessageCircle },
              { id: "sessions", label: "Live Sessions", icon: Calendar },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => {
                const typeConfig = CONTENT_TYPES[item.type];
                const TypeIcon = typeConfig.icon;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${typeConfig.color}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {typeConfig.label} • {item.category}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 p-2 rounded-lg border ${getStatusColor(item.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                        <span className="text-sm font-medium capitalize">
                          {item.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {item.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {item.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {item.comments}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {questions.map((question) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg shadow-md border border-border p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={question.asked_by.avatar_url} />
                        <AvatarFallback>
                          {question.asked_by.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {question.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Asked by {question.asked_by.name} • {new Date(question.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(question.priority)}`}>
                        {question.priority} priority
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {question.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {question.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {question.status === "pending" && (
                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Answer
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg shadow-md border border-border p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {session.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {session.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(session.scheduled_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="w-4 h-4" />
                      {session.duration} minutes
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {session.current_participants}/{session.max_participants} participants
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.status === "scheduled" && (
                      <Button size="sm" className="flex-1 bg-primary-600 hover:bg-primary-700">
                        <Globe className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Views", value: "12,450", icon: Eye, color: "text-blue-600" },
                { label: "Total Likes", value: "1,234", icon: ThumbsUp, color: "text-green-600" },
                { label: "Total Comments", value: "456", icon: MessageCircle, color: "text-purple-600" },
                { label: "Content Pieces", value: "23", icon: BookOpen, color: "text-orange-600" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-lg shadow-md border border-border p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content.slice(0, 5).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.views} views</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ThumbsUp className="w-4 h-4" />
                          {item.likes}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "New question received", time: "2 hours ago", type: "question" },
                      { action: "Content published", time: "1 day ago", type: "content" },
                      { action: "Session completed", time: "2 days ago", type: "session" },
                      { action: "Question answered", time: "3 days ago", type: "answer" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
