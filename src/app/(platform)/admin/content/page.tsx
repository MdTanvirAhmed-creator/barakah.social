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
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Upload,
  Download,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  Settings,
  Zap,
  Target,
  Award,
  Star,
  Calendar,
  Globe,
  Tag,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Play,
  Pause,
  Square,
  Maximize,
  Minimize,
  Copy,
  Share,
  Heart,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Flag,
  Shield,
  Lock,
  Unlock,
  Archive,
  RotateCcw,
  Save,
  Send,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import ContentEditor from "@/components/admin/ContentEditor";
import BulkImportTool from "@/components/admin/BulkImportTool";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "video" | "book" | "translation" | "imported";
  status: "draft" | "pending" | "review" | "approved" | "published" | "rejected";
  author: string;
  category: string;
  tags: string[];
  language: string;
  targetAudience: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  beneficialMarks: number;
  comments: number;
  shares: number;
  qualityScore: number;
  priority: "low" | "medium" | "high" | "urgent";
  reviewer?: string;
  reviewNotes?: string;
  importSource?: string;
  seoScore?: number;
  isFeatured: boolean;
  isArchived: boolean;
}

interface ContentMetrics {
  totalContent: number;
  publishedContent: number;
  pendingReview: number;
  draftContent: number;
  rejectedContent: number;
  totalViews: number;
  avgQualityScore: number;
  topPerforming: ContentItem[];
  recentActivity: any[];
  qualityAlerts: number;
  importQueue: number;
}

interface ImportJob {
  id: string;
  name: string;
  type: "csv" | "json" | "youtube" | "pdf" | "bulk";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalItems: number;
  processedItems: number;
  errors: number;
  createdAt: string;
  completedAt?: string;
}

const CONTENT_TYPES = {
  article: { icon: FileText, label: "Article", color: "text-blue-600", bgColor: "bg-blue-50" },
  video: { icon: Video, label: "Video", color: "text-red-600", bgColor: "bg-red-50" },
  book: { icon: BookOpen, label: "Book", color: "text-green-600", bgColor: "bg-green-50" },
  translation: { icon: Languages, label: "Translation", color: "text-purple-600", bgColor: "bg-purple-50" },
  imported: { icon: Download, label: "Imported", color: "text-orange-600", bgColor: "bg-orange-50" },
};

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-50", icon: Edit },
  pending: { label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: Clock },
  review: { label: "Under Review", color: "text-blue-600", bgColor: "bg-blue-50", icon: Eye },
  approved: { label: "Approved", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle },
  published: { label: "Published", color: "text-green-700", bgColor: "bg-green-100", icon: Globe },
  rejected: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-50", icon: X },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "text-green-600", bgColor: "bg-green-50" },
  medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-50" },
  urgent: { label: "Urgent", color: "text-red-600", bgColor: "bg-red-50" },
};

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "content" | "import" | "analytics">("dashboard");
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "pending" | "review" | "approved" | "published" | "rejected">("all");
  const [filterType, setFilterType] = useState<"all" | "article" | "video" | "book" | "translation" | "imported">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high" | "urgent">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views" | "quality" | "priority">("newest");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadContentData();
  }, []);

  const loadContentData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockContentItems: ContentItem[] = [
        {
          id: "1",
          title: "The Importance of Seeking Knowledge in Islam",
          type: "article",
          status: "published",
          author: "Dr. Ahmad Al-Rashid",
          category: "Aqeedah",
          tags: ["knowledge", "islam", "education"],
          language: "en",
          targetAudience: "intermediate",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          views: 1250,
          beneficialMarks: 89,
          comments: 23,
          shares: 45,
          qualityScore: 92,
          priority: "high",
          reviewer: "Shaykh Abdullah",
          seoScore: 85,
          isFeatured: true,
          isArchived: false,
        },
        {
          id: "2",
          title: "Tafsir of Surah Al-Fatiha",
          type: "video",
          status: "review",
          author: "Shaykh Abdul Nasir Jangda",
          category: "Quran",
          tags: ["tafsir", "quran", "surah-fatiha"],
          language: "en",
          targetAudience: "beginner",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          views: 0,
          beneficialMarks: 0,
          comments: 0,
          shares: 0,
          qualityScore: 0,
          priority: "medium",
          reviewer: "Dr. Fatima Al-Zahra",
          reviewNotes: "Excellent content, needs minor editing",
          seoScore: 78,
          isFeatured: false,
          isArchived: false,
        },
        {
          id: "3",
          title: "The Book of Knowledge by Imam Al-Ghazali",
          type: "book",
          status: "pending",
          author: "Imam Al-Ghazali",
          category: "Classics",
          tags: ["al-ghazali", "knowledge", "classics"],
          language: "en",
          targetAudience: "advanced",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          views: 0,
          beneficialMarks: 0,
          comments: 0,
          shares: 0,
          qualityScore: 0,
          priority: "low",
          seoScore: 0,
          isFeatured: false,
          isArchived: false,
        },
        {
          id: "4",
          title: "Islamic Finance Principles - Imported from Yaqeen Institute",
          type: "imported",
          status: "approved",
          author: "Yaqeen Institute",
          category: "Finance",
          tags: ["finance", "economics", "islamic-banking"],
          language: "en",
          targetAudience: "intermediate",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          views: 0,
          beneficialMarks: 0,
          comments: 0,
          shares: 0,
          qualityScore: 0,
          priority: "medium",
          importSource: "Yaqeen Institute",
          seoScore: 0,
          isFeatured: false,
          isArchived: false,
        },
      ];

      const mockMetrics: ContentMetrics = {
        totalContent: 156,
        publishedContent: 89,
        pendingReview: 23,
        draftContent: 31,
        rejectedContent: 13,
        totalViews: 45678,
        avgQualityScore: 87.5,
        topPerforming: mockContentItems.slice(0, 3),
        recentActivity: [
          { action: "Content published", item: "The Importance of Seeking Knowledge", time: "2 hours ago" },
          { action: "Review completed", item: "Tafsir of Surah Al-Fatiha", time: "4 hours ago" },
          { action: "Import completed", item: "Islamic Finance Principles", time: "6 hours ago" },
        ],
        qualityAlerts: 3,
        importQueue: 5,
      };

      const mockImportJobs: ImportJob[] = [
        {
          id: "1",
          name: "Yaqeen Institute Articles",
          type: "csv",
          status: "completed",
          progress: 100,
          totalItems: 25,
          processedItems: 25,
          errors: 0,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "YouTube Islamic Lectures",
          type: "youtube",
          status: "processing",
          progress: 65,
          totalItems: 50,
          processedItems: 32,
          errors: 2,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "PDF Book Collection",
          type: "pdf",
          status: "pending",
          progress: 0,
          totalItems: 15,
          processedItems: 0,
          errors: 0,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setContentItems(mockContentItems);
      setMetrics(mockMetrics);
      setImportJobs(mockImportJobs);
    } catch (error) {
      console.error("Error loading content data:", error);
      toast.error("Failed to load content data");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "archive" | "delete") => {
    try {
      // Simulate bulk action
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setContentItems(prev => {
        switch (action) {
          case "approve":
            return prev.map(item => 
              selectedItems.includes(item.id) 
                ? { ...item, status: "approved" as any }
                : item
            );
          case "reject":
            return prev.map(item => 
              selectedItems.includes(item.id) 
                ? { ...item, status: "rejected" as any }
                : item
            );
          case "archive":
            return prev.map(item => 
              selectedItems.includes(item.id) 
                ? { ...item, isArchived: true }
                : item
            );
          case "delete":
            return prev.filter(item => !selectedItems.includes(item.id));
          default:
            return prev;
        }
      });

      toast.success(`Bulk ${action} completed for ${selectedItems.length} items`);
      setSelectedItems([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  const handleContentAction = async (itemId: string, action: string) => {
    try {
      // Simulate content action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setContentItems(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            switch (action) {
              case "approve":
                return { ...item, status: "approved" as any };
              case "reject":
                return { ...item, status: "rejected" as any };
              case "publish":
                return { ...item, status: "published" as any, publishedAt: new Date().toISOString() };
              case "archive":
                return { ...item, isArchived: true };
              case "feature":
                return { ...item, isFeatured: !item.isFeatured };
              default:
                return item;
            }
          }
          return item;
        })
      );

      toast.success(`Content ${action} successful`);
    } catch (error) {
      console.error("Error performing content action:", error);
      toast.error("Failed to perform action");
    }
  };

  const filteredContent = contentItems.filter(item => {
    const statusMatch = filterStatus === "all" || item.status === filterStatus;
    const typeMatch = filterType === "all" || item.type === filterType;
    const priorityMatch = filterPriority === "all" || item.priority === filterPriority;
    const searchMatch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && typeMatch && priorityMatch && searchMatch;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "views":
        return b.views - a.views;
      case "quality":
        return b.qualityScore - a.qualityScore;
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
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
                Content Management
              </h1>
              <p className="text-muted-foreground">
                Manage content pipeline, reviews, and performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import Content
              </Button>
              <Button onClick={() => setShowContentEditor(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "content", label: "Content", icon: FileText },
              { id: "import", label: "Import Jobs", icon: Download },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
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

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Content</p>
                      <p className="text-2xl font-bold text-blue-900">{metrics.totalContent}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Published</p>
                      <p className="text-2xl font-bold text-green-900">{metrics.publishedContent}</p>
                    </div>
                    <Globe className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                      <p className="text-2xl font-bold text-yellow-900">{metrics.pendingReview}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Quality Alerts</p>
                      <p className="text-2xl font-bold text-red-900">{metrics.qualityAlerts}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Performing Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topPerforming.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.author}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{item.views} views</p>
                          <p className="text-sm text-muted-foreground">{item.qualityScore}% quality</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.item}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
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
                  <option value="imported">Imported</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Views</option>
                  <option value="quality">Best Quality</option>
                  <option value="priority">Priority</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedItems.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleBulkAction("approve")}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("reject")}>
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
                    <Archive className="w-4 h-4 mr-1" />
                    Archive
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Content List */}
            <div className="space-y-4">
              {sortedContent.map((item) => {
                const typeConfig = CONTENT_TYPES[item.type];
                const TypeIcon = typeConfig.icon;
                const statusConfig = STATUS_CONFIG[item.status];
                const StatusIcon = statusConfig.icon;
                const priorityConfig = PRIORITY_CONFIG[item.priority];
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, item.id]);
                              } else {
                                setSelectedItems(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="p-2 rounded-lg bg-muted">
                            <TypeIcon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{item.title}</h3>
                              {item.isFeatured && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">By {item.author}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{item.views} views</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
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
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-muted-foreground">
                              {item.comments} comments
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-muted-foreground">
                              {item.shares} shares
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-muted-foreground">
                              {item.qualityScore}% quality
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingContent(item);
                              setShowContentEditor(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContentAction(item.id, "feature")}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            {item.isFeatured ? "Unfeature" : "Feature"}
                          </Button>
                          {item.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleContentAction(item.id, "approve")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {item.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => handleContentAction(item.id, "publish")}
                            >
                              <Globe className="w-4 h-4 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Import Jobs Tab */}
        {activeTab === "import" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Import Jobs</h2>
              <Button onClick={() => setShowImportModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Import
              </Button>
            </div>

            <div className="space-y-4">
              {importJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{job.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.type.toUpperCase()} • {job.totalItems} items
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        job.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                        job.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        job.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {job.status}
                      </Badge>
                    </div>

                    {job.status === "processing" && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.processedItems} of {job.totalItems} items processed
                          {job.errors > 0 && ` • ${job.errors} errors`}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                      {job.completedAt && (
                        <span>Completed: {new Date(job.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-muted-foreground">
                Detailed content analytics and performance metrics coming soon
              </p>
            </div>
          </motion.div>
        )}

        {/* Content Editor Modal */}
        {showContentEditor && (
          <ContentEditor
            content={editingContent}
            onSave={(content) => {
              console.log("Content saved:", content);
              setShowContentEditor(false);
              setEditingContent(null);
            }}
            onClose={() => {
              setShowContentEditor(false);
              setEditingContent(null);
            }}
            isOpen={showContentEditor}
          />
        )}

        {/* Bulk Import Modal */}
        {showImportModal && (
          <BulkImportTool
            onClose={() => setShowImportModal(false)}
          />
        )}
      </div>
    </div>
  );
}
