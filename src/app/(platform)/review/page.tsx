"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  BookOpen,
  Languages,
  Users,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  Clock,
  Star,
  ThumbsUp,
  MessageCircle,
  Eye,
  User,
  Calendar,
  Tag,
  Globe,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  SortAsc,
  SortDesc,
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

interface ReviewItem {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "book" | "translation";
  contributorName: string;
  contributorAvatar?: string;
  category: string;
  tags: string[];
  targetAudience: "beginner" | "intermediate" | "advanced";
  content: string;
  sources: string[];
  status: "submitted" | "community_review" | "scholar_review" | "approved" | "rejected";
  reviewStage: number;
  communityFlags: number;
  beneficialMarks: number;
  createdAt: string;
  priority: "low" | "medium" | "high";
  estimatedReviewTime: number; // in minutes
}

interface ReviewerStats {
  totalReviews: number;
  approvedContent: number;
  rejectedContent: number;
  flaggedContent: number;
  averageReviewTime: number;
  reviewerLevel: string;
  helpfulReviews: number;
  rank: number;
}

const CONTENT_TYPES = {
  article: { icon: FileText, label: "Article", color: "text-info-600" },
  video: { icon: Video, label: "Video", color: "text-error-600" },
  book: { icon: BookOpen, label: "Book", color: "text-success-600" },
  translation: { icon: Languages, label: "Translation", color: "text-info-600" },
};

const TARGET_AUDIENCES = {
  beginner: { label: "Beginner", color: "text-success-600", bgColor: "bg-success-50" },
  intermediate: { label: "Intermediate", color: "text-warning-600", bgColor: "bg-warning-50" },
  advanced: { label: "Advanced", color: "text-error-600", bgColor: "bg-error-50" },
};

const REVIEW_STAGES = [
  { stage: 1, name: "Community Flagging", description: "Filter spam and inappropriate content" },
  { stage: 2, name: "Knowledgeable Review", description: "Review by members with 50+ beneficial marks" },
  { stage: 3, name: "Scholar Approval", description: "Religious content verification" },
  { stage: 4, name: "Publication", description: "Content published with attribution" },
];

export default function ReviewPage() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "flag">("approve");
  const [processing, setProcessing] = useState(false);
  const [filterStage, setFilterStage] = useState<"all" | "1" | "2" | "3">("all");
  const [filterType, setFilterType] = useState<"all" | "article" | "video" | "book" | "translation">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest");

  const supabase = createClient();

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // The community review queue: submissions in the pipeline, minus my own.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error } = await (supabase as any)
        .from("content_submissions")
        .select(
          "id, contributor_id, type, title, description, original_author, category, tags, language, target_audience, sources, content, status, review_stage, community_flags, beneficial_marks, created_at"
        )
        .in("status", ["submitted", "community_review", "scholar_review"])
        .neq("contributor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Contributor identities come from the public card view (privacy-safe).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submissions = (rows as any[]) ?? [];
      const contributorIds = [...new Set(submissions.map((r) => r.contributor_id))];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cards } = contributorIds.length
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("public_profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", contributorIds)
        : { data: [] };
      const cardById = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((cards as any[]) ?? []).map((c) => [c.id, c])
      );

      const items: ReviewItem[] = submissions.map((r) => {
        const card = cardById.get(r.contributor_id);
        return {
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
          reviewStage: r.review_stage ?? 1,
          contributorId: r.contributor_id,
          contributorName: card?.display_name || card?.username || "A community member",
          contributorAvatar: card?.avatar_url ?? undefined,
          communityFlags: r.community_flags ?? 0,
          beneficialMarks: r.beneficial_marks ?? 0,
          createdAt: r.created_at,
          priority:
            (r.community_flags ?? 0) > 0
              ? "high"
              : r.status === "scholar_review"
              ? "medium"
              : "low",
          estimatedReviewTime: Math.max(5, Math.ceil((r.content?.length ?? 0) / 800)),
        };
      });

      // Honest counts: my recorded reviews + the live queue. No rank, no level.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: myReviews } = await (supabase as any)
        .from("community_reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewer_id", user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: myApprovals } = await (supabase as any)
        .from("community_reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewer_id", user.id)
        .eq("action", "approve");

      setReviewItems(items);
      setReviewerStats({
        totalReviews: myReviews ?? 0,
        approvedContent: myApprovals ?? 0,
        rejectedContent: 0,
        flaggedContent: 0,
        averageReviewTime: 0,
        reviewerLevel: "",
        helpfulReviews: 0,
        rank: 0,
      });
    } catch (error) {
      console.error("Error loading review data:", error);
      toast.error("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (item: ReviewItem, action: "approve" | "reject" | "flag", comment: string) => {
    try {
      setProcessing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Your session expired. Sign in again.");
        return;
      }

      // Record the review (RLS: reviewer_id must be the signed-in user).
      // Pipeline stage transitions are applied by the moderation workflow,
      // not by individual reviewers.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("community_reviews").insert({
        submission_id: item.id,
        reviewer_id: user.id,
        action,
        comment: comment || null,
        stage: item.reviewStage,
      });
      if (error) throw error;

      // Reviewed items leave my queue.
      setReviewItems((prev) => prev.filter((reviewItem) => reviewItem.id !== item.id));

      if (action === "approve") {
        moment("Approved — may it benefit the community");
      } else {
        toast.success(`Content ${action}d`);
      }
      setShowReviewModal(false);
      setSelectedItem(null);
      setReviewComment("");
    } catch (error) {
      console.error("Error processing review:", error);
      toast.error("Failed to process review");
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = reviewItems.filter(item => {
    const stageMatch = filterStage === "all" || item.reviewStage.toString() === filterStage;
    const typeMatch = filterType === "all" || item.type === filterType;
    return stageMatch && typeMatch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-error-600 bg-error-50 border-error-200";
      case "medium": return "text-warning-600 bg-warning-50 border-warning-200";
      case "low": return "text-success-600 bg-success-50 border-success-200";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "text-info-600 bg-info-50 border-info-200";
      case "community_review": return "text-warning-600 bg-warning-50 border-warning-200";
      case "scholar_review": return "text-info-600 bg-info-50 border-info-200";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-50">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Community Review
              </h1>
              <p className="text-muted-foreground">
                Help maintain content quality through community review
              </p>
            </div>
          </div>

          {/* Reviewer Stats */}
          {reviewerStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-info-50 border-info-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-info-600">Total Reviews</p>
                      <p className="text-lg font-bold text-info-900">{reviewerStats.totalReviews}</p>
                    </div>
                    <BarChart3 className="w-6 h-6 text-info-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-success-50 border-success-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success-600">Approved</p>
                      <p className="text-lg font-bold text-success-900">{reviewerStats.approvedContent}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-warning-50 border-warning-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-warning-600">In queue</p>
                      <p className="text-lg font-bold text-warning-900">{reviewItems.length}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-warning-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Stages</option>
                <option value="1">Stage 1: Community Flagging</option>
                <option value="2">Stage 2: Knowledgeable Review</option>
                <option value="3">Stage 3: Scholar Review</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="video">Videos</option>
                <option value="book">Books</option>
                <option value="translation">Translations</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Review Queue */}
        <div className="space-y-4">
          {sortedItems.length === 0 ? (
            <GirihEmptyState
              title="The review queue is clear."
              description="When companions submit new knowledge, it gathers here for the community to weigh together."
            />
          ) : (
            sortedItems.map((item) => {
              const typeConfig = CONTENT_TYPES[item.type];
              const TypeIcon = typeConfig.icon;
              const audienceConfig = TARGET_AUDIENCES[item.targetAudience];
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <TypeIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {item.title}
                            </h3>
                            <Badge variant="outline" className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By {item.contributorName}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(item.priority)}`}>
                          {item.priority} priority
                        </Badge>
                        <Badge className={`${getStatusColor(item.status)}`}>
                          Stage {item.reviewStage}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-success-600" />
                          <span className="text-sm text-muted-foreground">
                            {item.beneficialMarks} beneficial
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-warning-600" />
                          <span className="text-sm text-muted-foreground">
                            {item.communityFlags} flags
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-info-600" />
                          <span className="text-sm text-muted-foreground">
                            ~{item.estimatedReviewTime} min
                          </span>
                        </div>
                        <Badge className={`${audienceConfig.bgColor} ${audienceConfig.color}`}>
                          {audienceConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg shadow-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Review Content
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReviewModal(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Content Details */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{selectedItem.title}</h3>
                  <p className="text-muted-foreground mb-4">{selectedItem.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Contributor</p>
                      <p className="text-sm text-muted-foreground">{selectedItem.contributorName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Category</p>
                      <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Target Audience</p>
                      <p className="text-sm text-muted-foreground">{TARGET_AUDIENCES[selectedItem.targetAudience].label}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Review Stage</p>
                      <p className="text-sm text-muted-foreground">{REVIEW_STAGES[selectedItem.reviewStage - 1]?.name}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Sources</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {selectedItem.sources.map((source, index) => (
                        <li key={index}>{source}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Content</p>
                    <div className="p-4 bg-muted rounded-lg max-h-40 overflow-y-auto">
                      <p className="text-sm">{selectedItem.content}</p>
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Review Decision</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Button
                      variant={reviewAction === "approve" ? "default" : "outline"}
                      onClick={() => setReviewAction("approve")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant={reviewAction === "reject" ? "destructive" : "outline"}
                      onClick={() => setReviewAction("reject")}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      variant={reviewAction === "flag" ? "secondary" : "outline"}
                      onClick={() => setReviewAction("flag")}
                      className="flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Flag
                    </Button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Review Comment
                    </label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Provide feedback on this content..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedItem, reviewAction, reviewComment)}
                      disabled={processing}
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <GirihLoader size="sm" className="[&_svg]:w-4 [&_svg]:h-4" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Submit Review
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
