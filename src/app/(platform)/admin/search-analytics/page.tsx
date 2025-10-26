"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Filter,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Eye,
  ThumbsUp,
  Bookmark,
  Share,
  Calendar,
  Globe,
  Zap,
  Brain,
  Target as TargetIcon,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  RefreshCw,
  Download,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Award,
  Trophy,
  Flame,
  Sparkles,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Target as TargetIcon2,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  Clock as ClockIcon,
  Eye as EyeIcon,
  ThumbsUp as ThumbsUpIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Calendar as CalendarIcon,
  Globe as GlobeIcon,
  Zap as ZapIcon,
  Brain as BrainIcon,
  Target as TargetIcon3,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Star as StarIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Flame as FlameIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SearchMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface PopularSearch {
  query: string;
  count: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  clickThroughRate: number;
  avgResults: number;
  category: string;
}

interface SearchTopic {
  topic: string;
  searches: number;
  clickThroughRate: number;
  avgResults: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  relatedQueries: string[];
}

interface ClickThroughRate {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  trend: 'up' | 'down' | 'stable';
}

interface SearchRefinement {
  originalQuery: string;
  refinedQuery: string;
  count: number;
  successRate: number;
  commonRefinements: string[];
}

interface FilterUsage {
  filterType: string;
  usageCount: number;
  successRate: number;
  avgResults: number;
  trend: 'up' | 'down' | 'stable';
}

interface ContentGap {
  query: string;
  searches: number;
  avgResults: number;
  gapScore: number;
  suggestedContent: string[];
  category: string;
}

interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  avgSearchTime: number;
  bounceRate: number;
  popularSearches: PopularSearch[];
  searchTopics: SearchTopic[];
  clickThroughRates: ClickThroughRate[];
  searchRefinements: SearchRefinement[];
  filterUsage: FilterUsage[];
  contentGaps: ContentGap[];
  timeRange: string;
  lastUpdated: string;
}

export default function SearchAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');
  

  useEffect(() => {
    // Load real analytics data
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const data = await fetchSearchAnalytics(timeRange);
        // setAnalytics(data);
        
        // For now, start with empty analytics
        setAnalytics(null);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDownIcon className="w-4 h-4 text-red-600" />;
      default: return <MinusIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Search Analytics</h1>
          <p className="text-muted-foreground">
            Insights into search behavior, popular queries, and content gaps
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalSearches)}</p>
                <p className="text-xs text-muted-foreground">+12.5% from last period</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <SearchIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.uniqueUsers)}</p>
                <p className="text-xs text-muted-foreground">+8.3% from last period</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Search Time</p>
                <p className="text-2xl font-bold">{analytics.avgSearchTime}s</p>
                <p className="text-xs text-muted-foreground">-0.3s from last period</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analytics.bounceRate)}</p>
                <p className="text-xs text-muted-foreground">-2.1% from last period</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <TargetIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="searches">Popular Searches</TabsTrigger>
          <TabsTrigger value="topics">Search Topics</TabsTrigger>
          <TabsTrigger value="ctr">Click-Through Rates</TabsTrigger>
          <TabsTrigger value="refinements">Refinements</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5" />
                  Top Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.popularSearches.slice(0, 5).map((search, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{search.query}</p>
                          <p className="text-sm text-muted-foreground">{search.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(search.count)}</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(search.trend)}
                          <span className={`text-sm ${getTrendColor(search.trend)}`}>
                            {search.change > 0 ? '+' : ''}{search.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Search Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.searchTopics.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic.topic}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(topic.searches)} searches
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(topic.searches / Math.max(...analytics.searchTopics.map(t => t.searches))) * 100} 
                          className="flex-1" 
                        />
                        <span className="text-sm text-muted-foreground">
                          {formatPercentage(topic.clickThroughRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5" />
                Filter Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.filterUsage.map((filter, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{filter.filterType}</span>
                      {getTrendIcon(filter.trend)}
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(filter.usageCount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(filter.successRate)} success rate
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {filter.avgResults} avg results
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Popular Searches Tab */}
        <TabsContent value="searches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="w-5 h-5" />
                Popular Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.popularSearches.map((search, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{search.query}</h3>
                          <p className="text-sm text-muted-foreground">{search.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(search.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(search.trend)}`}>
                          {search.change > 0 ? '+' : ''}{search.change}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Searches</p>
                        <p className="font-semibold">{formatNumber(search.count)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-semibold">{formatPercentage(search.clickThroughRate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Results</p>
                        <p className="font-semibold">{search.avgResults}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Search Topics Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.searchTopics.map((topic, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{topic.topic}</h3>
                        <p className="text-sm text-muted-foreground">{topic.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(topic.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(topic.trend)}`}>
                          {topic.trend === 'up' ? '+' : topic.trend === 'down' ? '-' : '='}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatNumber(topic.searches)}</p>
                        <p className="text-sm text-muted-foreground">Searches</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatPercentage(topic.clickThroughRate)}</p>
                        <p className="text-sm text-muted-foreground">CTR</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{topic.avgResults}</p>
                        <p className="text-sm text-muted-foreground">Avg Results</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{topic.relatedQueries.length}</p>
                        <p className="text-sm text-muted-foreground">Related</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Related Queries:</p>
                      <div className="flex flex-wrap gap-2">
                        {topic.relatedQueries.map((query, queryIndex) => (
                          <Badge key={queryIndex} variant="outline">
                            {query}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Click-Through Rates Tab */}
        <TabsContent value="ctr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Click-Through Rate Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.clickThroughRates.map((ctr, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{ctr.query}</h3>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(ctr.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(ctr.trend)}`}>
                          {ctr.trend === 'up' ? '+' : ctr.trend === 'down' ? '-' : '='}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-xl font-bold">{formatNumber(ctr.impressions)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clicks</p>
                        <p className="text-xl font-bold">{formatNumber(ctr.clicks)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CTR</p>
                        <p className="text-xl font-bold">{formatPercentage(ctr.ctr)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Position</p>
                        <p className="text-xl font-bold">{ctr.avgPosition.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Click-Through Rate</span>
                        <span>{formatPercentage(ctr.ctr)}</span>
                      </div>
                      <Progress value={ctr.ctr * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Refinements Tab */}
        <TabsContent value="refinements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="w-5 h-5" />
                Search Refinement Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.searchRefinements.map((refinement, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{refinement.originalQuery}</h3>
                        <p className="text-sm text-muted-foreground">
                          → {refinement.refinedQuery}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-xl font-bold">{formatPercentage(refinement.successRate)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Refinements</p>
                        <p className="text-lg font-semibold">{formatNumber(refinement.count)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-lg font-semibold">{formatPercentage(refinement.successRate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Common Terms</p>
                        <p className="text-lg font-semibold">{refinement.commonRefinements.length}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Common Refinements:</p>
                      <div className="flex flex-wrap gap-2">
                        {refinement.commonRefinements.map((term, termIndex) => (
                          <Badge key={termIndex} variant="outline">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Content Gaps Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.contentGaps.map((gap, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{gap.query}</h3>
                        <p className="text-sm text-muted-foreground">{gap.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Gap Score</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatPercentage(gap.gapScore)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Searches</p>
                        <p className="text-lg font-semibold">{formatNumber(gap.searches)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Results</p>
                        <p className="text-lg font-semibold">{gap.avgResults}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gap Score</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatPercentage(gap.gapScore)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Content:</p>
                      <div className="flex flex-wrap gap-2">
                        {gap.suggestedContent.map((content, contentIndex) => (
                          <Badge key={contentIndex} variant="outline" className="text-green-600">
                            {content}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Content Gap Score</span>
                        <span>{formatPercentage(gap.gapScore)}</span>
                      </div>
                      <Progress value={gap.gapScore * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
