"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Star,
  BookOpen,
  Users,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  Award,
  Lightbulb,
  ThumbsUp,
  ExternalLink,
  Calendar,
  Tag,
  User,
  Globe,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRecommendations, useTrendingContent, useEditorialPicks, useFreshContent } from '@/hooks/useRecommendations';
import { RecommendationResult } from '@/lib/recommendations/contentRecommender';

interface RecommendationEngineProps {
  userId?: string;
  contentId?: string;
  halaqaIds?: string[];
  category?: string;
  showFilters?: boolean;
  showStats?: boolean;
  maxHeight?: string;
}

export function RecommendationEngine({
  userId,
  contentId,
  halaqaIds,
  category,
  showFilters = true,
  showStats = true,
  maxHeight = '600px'
}: RecommendationEngineProps) {
  const [selectedTab, setSelectedTab] = useState('personalized');
  const [filterCategory, setFilterCategory] = useState(category || '');
  const [filterLimit, setFilterLimit] = useState(20);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Main recommendations hook
  const {
    recommendations: personalizedRecs,
    loading: personalizedLoading,
    error: personalizedError,
    refetch: refetchPersonalized,
    loadMore: loadMorePersonalized,
    hasMore: hasMorePersonalized
  } = useRecommendations({
    userId,
    contentId,
    halaqaIds,
    category: filterCategory,
    limit: filterLimit,
    includeTrending: true,
    includeEditorial: true,
    includeFresh: true,
    autoLoad: true
  });

  // Trending content
  const {
    recommendations: trendingRecs,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending
  } = useTrendingContent(halaqaIds, 15);

  // Editorial picks
  const {
    recommendations: editorialRecs,
    loading: editorialLoading,
    error: editorialError,
    refetch: refetchEditorial
  } = useEditorialPicks(filterCategory, 10);

  // Fresh content
  const {
    recommendations: freshRecs,
    loading: freshLoading,
    error: freshError,
    refetch: refetchFresh
  } = useFreshContent(10);

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      article: BookOpen,
      video: Eye,
      audio: MessageCircle,
      book: BookOpen,
      pdf: BookOpen,
      course: Award,
    };
    return icons[type] || BookOpen;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-green-600',
      intermediate: 'text-yellow-600',
      advanced: 'text-orange-600',
      scholar: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  const formatScore = (score: number) => {
    if (score >= 100) return '100%';
    if (score >= 10) return `${Math.round(score)}%`;
    return `${Math.round(score * 10) / 10}`;
  };

  const RecommendationCard = ({ rec, index }: { rec: RecommendationResult; index: number }) => {
    const TypeIcon = getContentTypeIcon(rec.type);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group"
      >
        <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {rec.author}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {rec.type}
                </Badge>
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary">
                    {formatScore(rec.score)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    match
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Reason */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4" />
              <span className="line-clamp-1">{rec.reason}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {rec.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {rec.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{rec.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                  <Eye className="w-3 h-3" />
                  {rec.view_count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                  <ThumbsUp className="w-3 h-3" />
                  {rec.beneficial_count}
                </div>
                <div className="text-xs text-muted-foreground">Beneficial</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                  <Star className="w-3 h-3" />
                  {rec.rating.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <Card className="border-destructive">
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium mb-2">Failed to load recommendations</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const StatsCard = ({ title, value, icon: Icon, color = "text-primary" }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-primary/10`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getCurrentRecommendations = () => {
    switch (selectedTab) {
      case 'personalized':
        return {
          recommendations: personalizedRecs,
          loading: personalizedLoading,
          error: personalizedError,
          refetch: refetchPersonalized,
          loadMore: loadMorePersonalized,
          hasMore: hasMorePersonalized
        };
      case 'trending':
        return {
          recommendations: trendingRecs,
          loading: trendingLoading,
          error: trendingError,
          refetch: refetchTrending,
          loadMore: null,
          hasMore: false
        };
      case 'editorial':
        return {
          recommendations: editorialRecs,
          loading: editorialLoading,
          error: editorialError,
          refetch: refetchEditorial,
          loadMore: null,
          hasMore: false
        };
      case 'fresh':
        return {
          recommendations: freshRecs,
          loading: freshLoading,
          error: freshError,
          refetch: refetchFresh,
          loadMore: null,
          hasMore: false
        };
      default:
        return {
          recommendations: personalizedRecs,
          loading: personalizedLoading,
          error: personalizedError,
          refetch: refetchPersonalized,
          loadMore: loadMorePersonalized,
          hasMore: hasMorePersonalized
        };
    }
  };

  const current = getCurrentRecommendations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Recommendations
          </h2>
          <p className="text-muted-foreground">
            Discover content tailored to your interests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => current.refetch()}
            disabled={current.loading}
          >
            {current.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border rounded-lg bg-muted/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="quran">Qur'anic Studies</SelectItem>
                    <SelectItem value="hadith">Hadith Studies</SelectItem>
                    <SelectItem value="fiqh">Islamic Jurisprudence</SelectItem>
                    <SelectItem value="aqeedah">Islamic Creed</SelectItem>
                    <SelectItem value="spirituality">Spirituality & Character</SelectItem>
                    <SelectItem value="practical">Practical Life</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Results</Label>
                <Select value={filterLimit.toString()} onValueChange={(value) => setFilterLimit(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="30">30 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => current.refetch()} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Personalized"
            value={personalizedRecs.length}
            icon={Target}
            color="text-blue-600"
          />
          <StatsCard
            title="Trending"
            value={trendingRecs.length}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatsCard
            title="Editorial Picks"
            value={editorialRecs.length}
            icon={Award}
            color="text-purple-600"
          />
          <StatsCard
            title="Fresh Content"
            value={freshRecs.length}
            icon={Zap}
            color="text-orange-600"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personalized" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Personalized
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="editorial" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Editorial
          </TabsTrigger>
          <TabsTrigger value="fresh" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Fresh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="space-y-4">
          {current.loading ? (
            <LoadingSkeleton />
          ) : current.error ? (
            <ErrorState error={current.error} onRetry={current.refetch} />
          ) : current.recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {current.recommendations.map((rec, index) => (
                  <RecommendationCard key={rec.content_id} rec={rec} index={index} />
                ))}
              </div>
              {current.hasMore && current.loadMore && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={current.loadMore}
                    disabled={current.loading}
                  >
                    {current.loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recommendations available</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          {trendingLoading ? (
            <LoadingSkeleton />
          ) : trendingError ? (
            <ErrorState error={trendingError} onRetry={refetchTrending} />
          ) : trendingRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingRecs.map((rec, index) => (
                <RecommendationCard key={rec.content_id} rec={rec} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No trending content available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editorial" className="space-y-4">
          {editorialLoading ? (
            <LoadingSkeleton />
          ) : editorialError ? (
            <ErrorState error={editorialError} onRetry={refetchEditorial} />
          ) : editorialRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editorialRecs.map((rec, index) => (
                <RecommendationCard key={rec.content_id} rec={rec} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No editorial picks available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fresh" className="space-y-4">
          {freshLoading ? (
            <LoadingSkeleton />
          ) : freshError ? (
            <ErrorState error={freshError} onRetry={refetchFresh} />
          ) : freshRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freshRecs.map((rec, index) => (
                <RecommendationCard key={rec.content_id} rec={rec} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No fresh content available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
