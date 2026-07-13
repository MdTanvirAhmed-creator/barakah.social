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
import { GirihLoader, GirihEmptyState } from "@/components/ui/girih";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { moment } from "@/hooks/useToast";

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
    color: "text-info-600",
    bgColor: "bg-info-50",
    borderColor: "border-info-200",
  },
  video: {
    icon: Video,
    label: "Video Link",
    color: "text-error-600",
    bgColor: "bg-error-50",
    borderColor: "border-error-200",
  },
  book: {
    icon: BookOpen,
    label: "Book Recommendation",
    color: "text-success-600",
    bgColor: "bg-success-50",
    borderColor: "border-success-200",
  },
  translation: {
    icon: Languages,
    label: "Translation",
    color: "text-info-600",
    bgColor: "bg-info-50",
    borderColor: "border-info-200",
  },
};

const TARGET_AUDIENCES = {
  beginner: {
    label: "Beginner",
    color: "text-success-600",
    bgColor: "bg-success-50",
    description: "New to Islamic knowledge",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-warning-600",
    bgColor: "bg-warning-50",
    description: "Some Islamic knowledge",
  },
  advanced: {
    label: "Advanced",
    color: "text-error-600",
    bgColor: "bg-error-50",
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
  const [activeTab, setActiveTab] = useState<"submit" | "my-submissions" | "review">("submit");
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error } = await (supabase as any)
        .from("content_submissions")
        .select(
          "id, type, title, description, original_author, category, tags, language, target_audience, sources, content, status, review_stage, community_flags, beneficial_marks, scholar_approval, created_at, updated_at"
        )
        .eq("contributor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mine: ContentSubmission[] = ((rows as any[]) ?? []).map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description ?? "",
        originalAuthor: r.original_author ?? "",
        category: r.category ?? "",
        tags: r.tags ?? [],
        language: r.language ?? "en",
        targetAudience: r.target_audience ?? "beginner",
        sources: r.sources ?? [],
        content: r.content,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        contributorId: user.id,
        contributorName: "",
        contributorAvatar: undefined,
        reviewStage: r.review_stage ?? 1,
        communityFlags: r.community_flags ?? 0,
        beneficialMarks: r.beneficial_marks ?? 0,
        scholarApproval: r.scholar_approval ?? false,
      }));

      setSubmissions(mine);
      // Honest counts derived from real rows — no points, no rank.
      setContributorStats({
        totalSubmissions: mine.length,
        approvedContent: mine.filter((m) => m.status === "approved").length,
        pendingReview: mine.filter((m) =>
          ["submitted", "community_review", "scholar_review"].includes(m.status)
        ).length,
        rejectedContent: mine.filter((m) => m.status === "rejected").length,
        beneficialMarks: mine.reduce((n, m) => n + m.beneficialMarks, 0),
        contributorLevel: "Contributor",
        badges: [],
        points: 0,
        rank: 0,
      });
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Your session expired. Sign in again.");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("content_submissions").insert({
        contributor_id: user.id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        original_author: formData.originalAuthor || null,
        category: formData.category || null,
        tags: formData.tags,
        language: formData.language,
        target_audience: formData.targetAudience,
        sources: formData.sources,
        content: formData.content,
        status: "submitted",
      });
      if (error) throw error;

      await loadData();
      
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

      moment("Submitted for community review");
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
      draft: "text-muted-foreground bg-muted border-border",
      submitted: "text-info-600 bg-info-50 border-info-200",
      community_review: "text-warning-600 bg-warning-50 border-warning-200",
      scholar_review: "text-info-600 bg-info-50 border-info-200",
      approved: "text-success-600 bg-success-50 border-success-200",
      rejected: "text-error-600 bg-error-50 border-error-200",
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
              <Card className="bg-info-50 border-info-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-info-600">Submissions</p>
                      <p className="text-lg font-bold text-info-900">{contributorStats.totalSubmissions}</p>
                    </div>
                    <Award className="w-6 h-6 text-info-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-success-50 border-success-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success-600">Approved Content</p>
                      <p className="text-lg font-bold text-success-900">{contributorStats.approvedContent}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-warning-50 border-warning-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-warning-600">In review</p>
                      <p className="text-lg font-bold text-warning-900">{contributorStats.pendingReview}</p>
                    </div>
                    <Star className="w-6 h-6 text-warning-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Beneficial marks</p>
                      <p className="text-lg font-bold text-foreground">{contributorStats.beneficialMarks}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
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
                          className="ml-1 hover:text-error-600"
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
                            ? `${config.bgColor} ${(config as any).borderColor} border-2`
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
                          className="text-error-600 hover:text-error-800"
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
                        <GirihLoader size="sm" className="[&_svg]:w-4 [&_svg]:h-4" />
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
            {submissions.length === 0 && (
              <GirihEmptyState
                title="Nothing submitted yet."
                description="Share a beneficial article, video, book, or translation — the community reviews every submission together."
                action={<Button onClick={() => setActiveTab("submit")}>Submit content</Button>}
              />
            )}
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
                          <ThumbsUp className="w-4 h-4 text-success-600" />
                          <span className="text-sm text-muted-foreground">
                            {submission.beneficialMarks} beneficial
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-warning-600" />
                          <span className="text-sm text-muted-foreground">
                            {submission.communityFlags} flags
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-info-600" />
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

      </div>
    </div>
  );
}
