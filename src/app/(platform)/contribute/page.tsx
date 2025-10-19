"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  BookOpen,
  Languages,
  Tag,
  Users,
  Award,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Link,
  Globe,
  Target,
  Bookmark,
  MessageCircle,
  Share,
  ThumbsUp,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Shield,
  Zap,
  Heart,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Save,
  Send,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ContentSubmission {
  id: string;
  type: "article" | "video" | "book" | "translation";
  title: string;
  description: string;
  originalAuthor: string;
  category: string;
  tags: string[];
  language: string;
  targetAudience: "beginner" | "intermediate" | "advanced";
  sources: string[];
  content: string;
  status: "draft" | "submitted" | "community_review" | "scholar_review" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  contributorId: string;
  contributorName: string;
  contributorAvatar?: string;
  reviewStage: number;
  communityFlags: number;
  beneficialMarks: number;
  scholarApproval: boolean;
}

interface ContributorStats {
  totalSubmissions: number;
  approvedContent: number;
  pendingReview: number;
  rejectedContent: number;
  beneficialMarks: number;
  contributorLevel: "Novice" | "Contributor" | "Knowledgeable" | "Scholar" | "Expert";
  badges: string[];
  points: number;
  rank: number;
}

const CONTENT_TYPES = {
  article: {
    icon: FileText,
    label: "Article",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  video: {
    icon: Video,
    label: "Video Link",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  book: {
    icon: BookOpen,
    label: "Book Recommendation",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  translation: {
    icon: Languages,
    label: "Translation",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

const TARGET_AUDIENCES = {
  beginner: {
    label: "Beginner",
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "New to Islamic knowledge",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    description: "Some Islamic knowledge",
  },
  advanced: {
    label: "Advanced",
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "Deep Islamic knowledge",
  },
};

const REVIEW_STAGES = [
  { stage: 1, name: "Community Flagging", description: "Spam and inappropriate content filtering" },
  { stage: 2, name: "Knowledgeable Review", description: "Review by members with 50+ beneficial marks" },
  { stage: 3, name: "Scholar Approval", description: "Religious content verification by scholars" },
  { stage: 4, name: "Publication", description: "Content published with contributor attribution" },
];

export default function ContributePage() {
  const [activeTab, setActiveTab] = useState<"submit" | "my-submissions" | "review" | "rewards">("submit");
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [contributorStats, setContributorStats] = useState<ContributorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: "article" as ContentSubmission["type"],
    title: "",
    description: "",
    originalAuthor: "",
    category: "",
    tags: [] as string[],
    language: "en",
    targetAudience: "beginner" as ContentSubmission["targetAudience"],
    sources: [] as string[],
    content: "",
  });

  const [newTag, setNewTag] = useState("");
  const [newSource, setNewSource] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockSubmissions: ContentSubmission[] = [
        {
          id: "1",
          type: "article",
          title: "The Importance of Seeking Knowledge in Islam",
          description: "A comprehensive article about the Islamic emphasis on seeking knowledge and its benefits",
          originalAuthor: "Dr. Ahmad Al-Rashid",
          category: "Aqeedah",
          tags: ["knowledge", "islam", "education", "seeking"],
          language: "en",
          targetAudience: "intermediate",
          sources: ["Sahih Bukhari", "Sahih Muslim", "Ibn Majah"],
          content: "In Islam, seeking knowledge is not just encouraged but considered a religious obligation...",
          status: "scholar_review",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          contributorId: "user1",
          contributorName: "Ahmad Ibn Abdullah",
          contributorAvatar: undefined,
          reviewStage: 3,
          communityFlags: 0,
          beneficialMarks: 45,
          scholarApproval: false,
        },
        {
          id: "2",
          type: "video",
          title: "Tafsir of Surah Al-Fatiha",
          description: "Detailed explanation of the opening chapter of the Quran",
          originalAuthor: "Shaykh Abdul Nasir Jangda",
          category: "Quran",
          tags: ["tafsir", "quran", "surah-fatiha", "explanation"],
          language: "en",
          targetAudience: "beginner",
          sources: ["Bayyinah Institute"],
          content: "https://bayyinah.com/tafsir-al-fatiha",
          status: "approved",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          contributorId: "user1",
          contributorName: "Ahmad Ibn Abdullah",
          contributorAvatar: undefined,
          reviewStage: 4,
          communityFlags: 0,
          beneficialMarks: 78,
          scholarApproval: true,
        },
        {
          id: "3",
          type: "book",
          title: "The Book of Knowledge by Imam Al-Ghazali",
          description: "Classic work on Islamic epistemology and the importance of knowledge",
          originalAuthor: "Imam Al-Ghazali",
          category: "Classics",
          tags: ["al-ghazali", "knowledge", "classics", "epistemology"],
          language: "en",
          targetAudience: "advanced",
          sources: ["Dar Al-Kotob Al-Ilmiyah"],
          content: "This timeless work explores the nature of knowledge in Islam...",
          status: "community_review",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          contributorId: "user1",
          contributorName: "Ahmad Ibn Abdullah",
          contributorAvatar: undefined,
          reviewStage: 2,
          communityFlags: 1,
          beneficialMarks: 23,
          scholarApproval: false,
        },
      ];

      const mockStats: ContributorStats = {
        totalSubmissions: 12,
        approvedContent: 8,
        pendingReview: 3,
        rejectedContent: 1,
        beneficialMarks: 156,
        contributorLevel: "Knowledgeable",
        badges: ["Knowledge Contributor", "Quality Reviewer", "Community Helper"],
        points: 1240,
        rank: 15,
      };

      setSubmissions(mockSubmissions);
      setContributorStats(mockStats);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load contribution data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate form
      if (!formData.title || !formData.description || !formData.content) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newSubmission: ContentSubmission = {
        id: Date.now().toString(),
        type: formData.type,
        title: formData.title,
        description: formData.description,
        originalAuthor: formData.originalAuthor,
        category: formData.category,
        tags: formData.tags,
        language: formData.language,
        targetAudience: formData.targetAudience,
        sources: formData.sources,
        content: formData.content,
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contributorId: "current-user",
        contributorName: "Current User",
        contributorAvatar: undefined,
        reviewStage: 1,
        communityFlags: 0,
        beneficialMarks: 0,
        scholarApproval: false,
      };

      setSubmissions(prev => [newSubmission, ...prev]);
      
      // Reset form
      setFormData({
        type: "article",
        title: "",
        description: "",
        originalAuthor: "",
        category: "",
        tags: [],
        language: "en",
        targetAudience: "beginner",
        sources: [],
        content: "",
      });

      toast.success("Content submitted successfully! It will be reviewed by the community.");
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content");
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSource = () => {
    if (newSource.trim() && !formData.sources.includes(newSource.trim())) {
      setFormData(prev => ({
        ...prev,
        sources: [...prev.sources, newSource.trim()]
      }));
      setNewSource("");
    }
  };

  const removeSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s !== source)
    }));
  };

  const getStatusColor = (status: ContentSubmission["status"]) => {
    const colors = {
      draft: "text-gray-600 bg-gray-50 border-gray-200",
      submitted: "text-blue-600 bg-blue-50 border-blue-200",
      community_review: "text-yellow-600 bg-yellow-50 border-yellow-200",
      scholar_review: "text-purple-600 bg-purple-50 border-purple-200",
      approved: "text-green-600 bg-green-50 border-green-200",
      rejected: "text-red-600 bg-red-50 border-red-200",
    };
    return colors[status];
  };

  const getStatusIcon = (status: ContentSubmission["status"]) => {
    const icons = {
      draft: Edit,
      submitted: Send,
      community_review: Users,
      scholar_review: GraduationCap,
      approved: CheckCircle,
      rejected: AlertTriangle,
    };
    return icons[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-50">
              <Lightbulb className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Community Contribution
              </h1>
              <p className="text-muted-foreground">
                Share knowledge and contribute to the Islamic community
              </p>
            </div>
          </div>

          {/* Contributor Stats */}
          {contributorStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Contributor Level</p>
                      <p className="text-lg font-bold text-blue-900">{contributorStats.contributorLevel}</p>
                    </div>
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Approved Content</p>
                      <p className="text-lg font-bold text-green-900">{contributorStats.approvedContent}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Points</p>
                      <p className="text-lg font-bold text-purple-900">{contributorStats.points}</p>
                    </div>
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Rank</p>
                      <p className="text-lg font-bold text-orange-900">#{contributorStats.rank}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "submit", label: "Submit Content", icon: Plus },
              { id: "my-submissions", label: "My Submissions", icon: FileText },
              { id: "review", label: "Review Content", icon: Users },
              { id: "rewards", label: "Rewards", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Submission Form */}
        {activeTab === "submit" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Submit New Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Content Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(CONTENT_TYPES).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.type === type
                              ? `${config.bgColor} ${config.borderColor} border-2`
                              : "border-border hover:border-primary-200"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${config.color}`} />
                          <p className="text-sm font-medium">{config.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter content title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Aqeedah, Fiqh, Quran"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the content"
                    rows={3}
                  />
                </div>

                {/* Original Author */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Original Author/Source
                  </label>
                  <Input
                    value={formData.originalAuthor}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalAuthor: e.target.value }))}
                    placeholder="Name of original author or source"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(TARGET_AUDIENCES).map(([level, config]) => (
                      <button
                        key={level}
                        onClick={() => setFormData(prev => ({ ...prev, targetAudience: level as any }))}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.targetAudience === level
                            ? `${config.bgColor} ${config.borderColor} border-2`
                            : "border-border hover:border-primary-200"
                        }`}
                      >
                        <p className="font-medium">{config.label}</p>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sources/References
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="Add a source or reference"
                      onKeyPress={(e) => e.key === "Enter" && addSource()}
                    />
                    <Button onClick={addSource} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.sources.map((source) => (
                      <div key={source} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{source}</span>
                        <button
                          onClick={() => removeSource(source)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content *
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter the main content here..."
                    rows={8}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="lg"
                    className="min-w-32"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Content
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* My Submissions */}
        {activeTab === "my-submissions" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {submissions.map((submission) => {
              const StatusIcon = getStatusIcon(submission.status);
              const typeConfig = CONTENT_TYPES[submission.type];
              const TypeIcon = typeConfig.icon;
              
              return (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <TypeIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {submission.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {submission.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By {submission.originalAuthor}</span>
                            <span>•</span>
                            <span>{submission.category}</span>
                            <span>•</span>
                            <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(submission.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">
                          {submission.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">
                            {submission.beneficialMarks} beneficial
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-muted-foreground">
                            {submission.communityFlags} flags
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-muted-foreground">
                            Stage {submission.reviewStage}/4
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {submission.status === "draft" && (
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Review Content */}
        {activeTab === "review" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Review Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No content to review
                  </h3>
                  <p className="text-muted-foreground">
                    Content will appear here when it needs community review
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Rewards */}
        {activeTab === "rewards" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                  {contributorStats?.badges.map((badge, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">{badge}</span>
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Rewards & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Knowledge Contributor Badge</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Early Access to New Content</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Exclusive Halaqa Invitations</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Points toward Verified Status</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
