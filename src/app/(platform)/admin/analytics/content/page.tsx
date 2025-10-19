"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  Heart,
  Share2,
  Bookmark,
  Target,
  Award,
  AlertTriangle,
  Search,
  Globe,
  Star,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Activity,
  Zap,
  Brain,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

interface EngagementMetrics {
  total_views: number;
  total_completions: number;
  total_beneficial_marks: number;
  average_time_spent: number;
  sharing_count: number;
  bookmark_count: number;
  engagement_rate: number;
  completion_rate: number;
  beneficial_rate: number;
}

interface LearningOutcomes {
  quiz_attempts: number;
  quiz_completion_rate: number;
  average_quiz_score: number;
  path_completions: number;
  path_completion_rate: number;
  retention_score: number;
  spaced_review_completions: number;
}

interface ContentGaps {
  most_searched_topics: Array<{
    topic: string;
    search_count: number;
    has_content: boolean;
  }>;
  user_requests: Array<{
    request: string;
    count: number;
    category: string;
  }>;
  underserved_categories: Array<{
    category: string;
    demand_score: number;
    content_count: number;
  }>;
  language_needs: Array<{
    language: string;
    demand_count: number;
    available_content: number;
  }>;
}

interface QualityScores {
  average_rating: number;
  total_ratings: number;
  scholar_endorsements: number;
  report_count: number;
  complaint_ratio: number;
  update_frequency: number;
  quality_score: number;
}

interface ContentAnalytics {
  content_id: string;
  title: string;
  type: string;
  category: string;
  author: string;
  created_at: string;
  engagement: EngagementMetrics;
  learning: LearningOutcomes;
  quality: QualityScores;
  performance_score: number;
}

export default function ContentAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGaps | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('performance_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const supabase = createClient();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, categoryFilter, typeFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load content analytics
      const { data: contentData } = await supabase
        .from('content_analytics')
        .select(`
          *,
          content:content_submissions(
            title, type, category, author:profiles(full_name)
          )
        `)
        .order('performance_score', { ascending: false });

      if (contentData) {
        setAnalytics(contentData);
      }

      // Load content gaps analysis
      const { data: gapsData } = await supabase
        .from('content_gaps_analysis')
        .select('*')
        .single();

      if (gapsData) {
        setContentGaps(gapsData);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Performance Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track engagement, learning outcomes, content gaps, and quality metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="quran">Quran Studies</SelectItem>
            <SelectItem value="hadith">Hadith Studies</SelectItem>
            <SelectItem value="fiqh">Islamic Jurisprudence</SelectItem>
            <SelectItem value="aqeedah">Islamic Creed</SelectItem>
            <SelectItem value="spirituality">Spirituality</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="quiz">Quizzes</SelectItem>
            <SelectItem value="path">Learning Paths</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.total_views, 0))}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.engagement.completion_rate, 0) / analytics.length)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quality Score</p>
                      <p className="text-2xl font-bold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.quality.quality_score, 0) / analytics.length)}%
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(analytics.reduce((sum, item) => sum + item.engagement.average_time_spent, 0) / analytics.length)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.slice(0, 10).map((item) => (
                      <TableRow key={item.content_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              by {item.author}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell>{formatNumber(item.engagement.total_views)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.engagement.completion_rate} className="w-16" />
                            <span className="text-sm">{item.engagement.completion_rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{item.quality.average_rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPerformanceIcon(item.performance_score)}
                            <span className={getPerformanceColor(item.performance_score)}>
                              {item.performance_score}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Views & Completions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Views</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.total_views, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completions</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.total_completions, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Completion Rate</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.engagement.completion_rate, 0) / analytics.length)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Beneficial Marks</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.total_beneficial_marks, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shares</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.sharing_count, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bookmarks</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.engagement.bookmark_count, 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Avg. Time Spent</span>
                      <span className="font-semibold">
                        {formatDuration(analytics.reduce((sum, item) => sum + item.engagement.average_time_spent, 0) / analytics.length)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement Rate</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.engagement.engagement_rate, 0) / analytics.length)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Quiz Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Attempts</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.learning.quiz_attempts, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.learning.quiz_completion_rate, 0) / analytics.length)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.learning.average_quiz_score, 0) / analytics.length)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Learning Paths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Path Completions</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.learning.path_completions, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.learning.path_completion_rate, 0) / analytics.length)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention Score</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.learning.retention_score, 0) / analytics.length)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Content Gaps Tab */}
        <TabsContent value="gaps">
          <div className="space-y-6">
            {contentGaps && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Most Searched Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {contentGaps.most_searched_topics.slice(0, 5).map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{topic.topic}</span>
                              {topic.has_content ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <Badge variant="outline">{topic.search_count} searches</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        User Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {contentGaps.user_requests.slice(0, 5).map((request, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{request.request}</span>
                              <div className="text-sm text-muted-foreground">{request.category}</div>
                            </div>
                            <Badge variant="outline">{request.count} requests</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Underserved Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {contentGaps.underserved_categories.slice(0, 5).map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{category.category}</span>
                              <div className="text-sm text-muted-foreground">
                                {category.content_count} pieces of content
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{category.demand_score}%</div>
                              <div className="text-sm text-muted-foreground">demand</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Language Needs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {contentGaps.language_needs.slice(0, 5).map((language, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{language.language}</span>
                              <div className="text-sm text-muted-foreground">
                                {language.available_content} available
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{language.demand_count}</div>
                              <div className="text-sm text-muted-foreground">requests</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    User Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.quality.average_rating, 0) / analytics.length)}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Ratings</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.quality.total_ratings, 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Scholar Endorsements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Endorsements</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.quality.scholar_endorsements, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Score</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.quality.quality_score, 0) / analytics.length)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Reports & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Reports</span>
                      <span className="font-semibold">
                        {formatNumber(analytics.reduce((sum, item) => sum + item.quality.report_count, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Complaint Ratio</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.quality.complaint_ratio, 0) / analytics.length)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Update Frequency</span>
                      <span className="font-semibold">
                        {Math.round(analytics.reduce((sum, item) => sum + item.quality.update_frequency, 0) / analytics.length)} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Endorsements</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Quality Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.slice(0, 10).map((item) => (
                      <TableRow key={item.content_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.type}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{item.quality.average_rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({item.quality.total_ratings})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-blue-500" />
                            <span>{item.quality.scholar_endorsements}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>{item.quality.report_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.quality.quality_score} className="w-16" />
                            <span className={getPerformanceColor(item.quality.quality_score)}>
                              {item.quality.quality_score}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
