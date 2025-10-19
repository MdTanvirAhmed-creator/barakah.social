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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  submissionId: string;
  title: string;
  description: string;
  type: "article" | "video" | "book" | "translation";
  contributorName: string;
  contributorAvatar?: string;
  contributorLevel: string;
  category: string;
  tags: string[];
  targetAudience: "beginner" | "intermediate" | "advanced";
  content: string;
  sources: string[];
  status: "submitted" | "community_review" | "scholar_review";
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
  article: { icon: FileText, label: "Article", color: "text-blue-600" },
  video: { icon: Video, label: "Video", color: "text-red-600" },
  book: { icon: BookOpen, label: "Book", color: "text-green-600" },
  translation: { icon: Languages, label: "Translation", color: "text-purple-600" },
};

const TARGET_AUDIENCES = {
  beginner: { label: "Beginner", color: "text-green-600", bgColor: "bg-green-50" },
  intermediate: { label: "Intermediate", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  advanced: { label: "Advanced", color: "text-red-600", bgColor: "bg-red-50" },
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
      
      // Mock data for demonstration
      const mockReviewItems: ReviewItem[] = [
        {
          id: "1",
          submissionId: "sub1",
          title: "The Importance of Seeking Knowledge in Islam",
          description: "A comprehensive article about the Islamic emphasis on seeking knowledge and its benefits",
          type: "article",
          contributorName: "Ahmad Ibn Abdullah",
          contributorAvatar: undefined,
          contributorLevel: "Knowledgeable",
          category: "Aqeedah",
          tags: ["knowledge", "islam", "education"],
          targetAudience: "intermediate",
          content: "In Islam, seeking knowledge is not just encouraged but considered a religious obligation...",
          sources: ["Sahih Bukhari", "Sahih Muslim"],
          status: "community_review",
          reviewStage: 2,
          communityFlags: 0,
          beneficialMarks: 45,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          estimatedReviewTime: 15,
        },
        {
          id: "2",
          submissionId: "sub2",
          title: "Tafsir of Surah Al-Fatiha",
          description: "Detailed explanation of the opening chapter of the Quran",
          type: "video",
          contributorName: "Fatima Al-Zahra",
          contributorAvatar: undefined,
          contributorLevel: "Contributor",
          category: "Quran",
          tags: ["tafsir", "quran", "surah-fatiha"],
          targetAudience: "beginner",
          content: "https://bayyinah.com/tafsir-al-fatiha",
          sources: ["Bayyinah Institute"],
          status: "scholar_review",
          reviewStage: 3,
          communityFlags: 0,
          beneficialMarks: 78,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          estimatedReviewTime: 10,
        },
        {
          id: "3",
          submissionId: "sub3",
          title: "The Book of Knowledge by Imam Al-Ghazali",
          description: "Classic work on Islamic epistemology and the importance of knowledge",
          type: "book",
          contributorName: "Omar Al-Rashid",
          contributorAvatar: undefined,
          contributorLevel: "Scholar",
          category: "Classics",
          tags: ["al-ghazali", "knowledge", "classics"],
          targetAudience: "advanced",
          content: "This timeless work explores the nature of knowledge in Islam...",
          sources: ["Dar Al-Kotob Al-Ilmiyah"],
          status: "community_review",
          reviewStage: 2,
          communityFlags: 1,
          beneficialMarks: 23,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "low",
          estimatedReviewTime: 20,
        },
      ];

      const mockStats: ReviewerStats = {
        totalReviews: 45,
        approvedContent: 38,
        rejectedContent: 5,
        flaggedContent: 2,
        averageReviewTime: 12,
        reviewerLevel: "Expert Reviewer",
        helpfulReviews: 42,
        rank: 8,
      };

      setReviewItems(mockReviewItems);
      setReviewerStats(mockStats);
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
      
      // Simulate review processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update item status based on action
      let newStatus = item.status;
      let newStage = item.reviewStage;
      
      if (action === "approve") {
        if (item.reviewStage === 2) {
          newStage = 3;
          newStatus = "scholar_review";
        } else if (item.reviewStage === 3) {
          newStage = 4;
          newStatus = "approved";
        }
      } else if (action === "reject") {
        newStatus = "rejected";
      } else if (action === "flag") {
        // Flag for further review
      }

      // Update the item in the list
      setReviewItems(prev => 
        prev.map(reviewItem => 
          reviewItem.id === item.id 
            ? { 
                ...reviewItem, 
                status: newStatus as any,
                reviewStage: newStage,
                communityFlags: action === "flag" ? reviewItem.communityFlags + 1 : reviewItem.communityFlags
              }
            : reviewItem
        )
      );

      // Remove from review queue if approved or rejected
      if (action === "approve" && newStage === 4) {
        setReviewItems(prev => prev.filter(reviewItem => reviewItem.id !== item.id));
      } else if (action === "reject") {
        setReviewItems(prev => prev.filter(reviewItem => reviewItem.id !== item.id));
      }

      toast.success(`Content ${action}d successfully`);
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
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "text-blue-600 bg-blue-50 border-blue-200";
      case "community_review": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "scholar_review": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
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
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                      <p className="text-lg font-bold text-blue-900">{reviewerStats.totalReviews}</p>
                    </div>
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Approved</p>
                      <p className="text-lg font-bold text-green-900">{reviewerStats.approvedContent}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Reviewer Level</p>
                      <p className="text-lg font-bold text-purple-900">{reviewerStats.reviewerLevel}</p>
                    </div>
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Rank</p>
                      <p className="text-lg font-bold text-orange-900">#{reviewerStats.rank}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-orange-600" />
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
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No content to review
                </h3>
                <p className="text-muted-foreground">
                  All content has been reviewed or no new submissions are available
                </p>
              </CardContent>
            </Card>
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
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">
                            {item.beneficialMarks} beneficial
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-muted-foreground">
                            {item.communityFlags} flags
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600" />
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
                      <p className="text-sm text-muted-foreground">{selectedItem.contributorName} ({selectedItem.contributorLevel})</p>
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
