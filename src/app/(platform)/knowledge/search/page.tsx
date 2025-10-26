"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Clock,
  BookOpen,
  Video,
  Headphones,
  FileText,
  Users,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Info,
  Lightbulb,
  Target,
  Zap,
  Eye,
  ThumbsUp,
  Bookmark,
  Share,
  Calendar,
  User,
  Tag,
  Globe,
  BarChart3,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  FilterX,
  SearchCheck,
  History,
  TrendingDown,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Hash,
  Code,
  Brain,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQueryProcessor } from '@/hooks/useQueryProcessor';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  format: 'article' | 'video' | 'audio' | 'course' | 'book';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'scholar';
  estimatedTime: number;
  tags: string[];
  thumbnail?: string;
  publishedAt: string;
  viewCount: number;
  beneficialCount: number;
  bookmarkCount: number;
  score: number;
  highlights: {
    title: string[];
    description: string[];
    content: string[];
  };
  reason?: string;
  isBookmarked?: boolean;
  isBeneficial?: boolean;
}

interface SearchFilters {
  category: string[];
  format: string[];
  difficulty: string[];
  language: string[];
  dateRange: string;
  author: string[];
  tags: string[];
  sortBy: 'relevance' | 'date' | 'popularity' | 'rating';
  sortOrder: 'asc' | 'desc';
}

interface SearchState {
  query: string;
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  searchTime: number;
  suggestions: string[];
  recentSearches: string[];
  relatedQueries: string[];
}

export default function KnowledgeSearchPage() {
  // State Management
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    loading: false,
    error: null,
    searchTime: 0,
    suggestions: [],
    recentSearches: [],
    relatedQueries: []
  });

  const [filters, setFilters] = useState<SearchFilters>({
    category: [],
    format: [],
    difficulty: [],
    language: [],
    dateRange: '',
    author: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSearchTips, setShowSearchTips] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Hooks
  const debouncedQuery = useDebounce(searchState.query, 300);
  const { processedQuery, processing, error: queryError } = useQueryProcessor({
    autoProcess: true,
    saveToHistory: true,
    userId: 'demo-user'
  });

  const { trackView, trackBeneficialMark, trackBookmark } = usePersonalization({
    userId: 'demo-user',
    autoRefresh: true
  });

  // TODO: Replace with real search results from database
  // Mock data removed for production

  // Search functionality
  const performSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        loading: false,
        error: null
      }));
      return;
    }

    setSearchState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const startTime = Date.now();
      
      // Simulate search processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Replace with real search results from database
      // For now, return empty results
      let filteredResults: SearchResult[] = [];

      // Sort results
      filteredResults.sort((a, b) => {
        if (filters.sortBy === 'relevance') return b.score - a.score;
        if (filters.sortBy === 'date') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        if (filters.sortBy === 'popularity') return b.viewCount - a.viewCount;
        if (filters.sortBy === 'rating') return b.beneficialCount - a.beneficialCount;
        return 0;
      });

      if (filters.sortOrder === 'asc') {
        filteredResults.reverse();
      }

      const resultsPerPage = 20;
      const totalResults = filteredResults.length;
      const totalPages = Math.ceil(totalResults / resultsPerPage);
      const startIndex = (page - 1) * resultsPerPage;
      const paginatedResults = filteredResults.slice(startIndex, startIndex + resultsPerPage);

      const searchTime = Date.now() - startTime;

      setSearchState(prev => ({
        ...prev,
        results: paginatedResults,
        totalResults,
        currentPage: page,
        totalPages,
        loading: false,
        searchTime,
        error: null
      }));

    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }));
    }
  }, [filters]);

  // Debounced search effect
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, 1);
    }
  }, [debouncedQuery, performSearch]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchState(prev => ({ ...prev, query: value }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: [],
      format: [],
      difficulty: [],
      language: [],
      dateRange: '',
      author: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  // Handle result actions
  const handleViewResult = async (resultId: string) => {
    await trackView(resultId, { deviceType: 'desktop', sessionId: 'search-session' });
  };

  const handleBeneficialMark = async (resultId: string) => {
    await trackBeneficialMark(resultId);
    setSearchState(prev => ({
      ...prev,
      results: prev.results.map(result => 
        result.id === resultId 
          ? { ...result, isBeneficial: true, beneficialCount: result.beneficialCount + 1 }
          : result
      )
    }));
  };

  const handleBookmark = async (resultId: string) => {
    await trackBookmark(resultId);
    setSearchState(prev => ({
      ...prev,
      results: prev.results.map(result => 
        result.id === resultId 
          ? { ...result, isBookmarked: true, bookmarkCount: result.bookmarkCount + 1 }
          : result
      )
    }));
  };

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'course': return BookOpen;
      case 'book': return FileText;
      default: return FileText;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-blue-600';
      case 'advanced': return 'text-purple-600';
      case 'scholar': return 'text-gold-600';
      default: return 'text-gray-600';
    }
  };

  // Render search result card
  const renderSearchResult = (result: SearchResult) => {
    const FormatIcon = getFormatIcon(result.format);
    const isExpanded = expandedResult === result.id;

    return (
      <motion.div
        key={result.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group"
      >
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-16 h-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <FormatIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {result.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {result.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{result.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{result.estimatedTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{result.viewCount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {result.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {result.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Highlights */}
                    {result.highlights.title.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Matching terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.highlights.title.map((highlight, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reason */}
                    {result.reason && (
                      <div className="mb-3 p-2 bg-primary/5 rounded-lg">
                        <p className="text-sm text-primary">
                          <Sparkles className="w-4 h-4 inline mr-1" />
                          {result.reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleViewResult(result.id)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBeneficialMark(result.id)}
                      disabled={result.isBeneficial}
                      className="w-full"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {result.beneficialCount}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBookmark(result.id)}
                      disabled={result.isBookmarked}
                      className="w-full"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      {result.bookmarkCount}
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Content Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Format:</span>
                              <Badge variant="outline">{result.format}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Category:</span>
                              <span>{result.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Difficulty:</span>
                              <Badge 
                                variant="outline" 
                                className={getDifficultyColor(result.difficulty)}
                              >
                                {result.difficulty}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Published:</span>
                              <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Engagement</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Views:</span>
                              <span>{result.viewCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Beneficial:</span>
                              <span>{result.beneficialCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bookmarks:</span>
                              <span>{result.bookmarkCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Score:</span>
                              <span>{Math.round(result.score * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search knowledge base... (e.g., 'prayer times', 'five pillars', 'halal food')"
                value={searchState.query}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
              {searchState.query && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.values(filters).some(filter => 
                  Array.isArray(filter) ? filter.length > 0 : filter !== '' && filter !== 'relevance' && filter !== 'desc'
                ) && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(filters).filter(filter => 
                      Array.isArray(filter) ? filter.length > 0 : filter !== '' && filter !== 'relevance' && filter !== 'desc'
                    ).length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="gap-2"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setShowSearchTips(!showSearchTips)}
                      className="gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Tips
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search tips and advanced operators</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Search Tips */}
          <AnimatePresence>
            {showSearchTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-muted rounded-lg"
              >
                <h4 className="font-medium mb-2">Search Tips</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-1">Operators</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• "exact phrase" - Search for exact phrases</li>
                      <li>• -exclude - Exclude terms from results</li>
                      <li>• +include - Require specific terms</li>
                      <li>• AND, OR, NOT - Boolean operators</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">Examples</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• "five pillars" - Exact phrase</li>
                      <li>• prayer -music - Exclude music</li>
                      <li>• hajj OR umrah - Either term</li>
                      <li>• islamic AND finance - Both terms</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                className="w-80 flex-shrink-0"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-2"
                      >
                        <FilterX className="w-4 h-4" />
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <div className="mt-2 space-y-2">
                        {['Fundamentals', 'Worship', 'Language', 'History', 'Spirituality'].map(category => (
                          <label key={category} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.category.includes(category)}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...filters.category, category]
                                  : filters.category.filter(c => c !== category);
                                handleFilterChange('category', newCategories);
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Format Filter */}
                    <div>
                      <Label className="text-sm font-medium">Format</Label>
                      <div className="mt-2 space-y-2">
                        {['article', 'video', 'audio', 'course', 'book'].map(format => (
                          <label key={format} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.format.includes(format)}
                              onChange={(e) => {
                                const newFormats = e.target.checked
                                  ? [...filters.format, format]
                                  : filters.format.filter(f => f !== format);
                                handleFilterChange('format', newFormats);
                              }}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{format}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                      <Label className="text-sm font-medium">Difficulty</Label>
                      <div className="mt-2 space-y-2">
                        {['beginner', 'intermediate', 'advanced', 'scholar'].map(difficulty => (
                          <label key={difficulty} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.difficulty.includes(difficulty)}
                              onChange={(e) => {
                                const newDifficulties = e.target.checked
                                  ? [...filters.difficulty, difficulty]
                                  : filters.difficulty.filter(d => d !== difficulty);
                                handleFilterChange('difficulty', newDifficulties);
                              }}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{difficulty}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <Label className="text-sm font-medium">Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="popularity">Popularity</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <Label className="text-sm font-medium">Order</Label>
                      <Select
                        value={filters.sortOrder}
                        onValueChange={(value) => handleFilterChange('sortOrder', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Results Header */}
            {searchState.query && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Search Results for "{searchState.query}"
                    </h2>
                    <p className="text-muted-foreground">
                      {searchState.totalResults.toLocaleString()} results found in {searchState.searchTime}ms
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {searchState.loading && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => performSearch(searchState.query, searchState.currentPage)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Query Processing Info */}
                {processedQuery && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="font-medium">Query Processing</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Original:</span>
                          <code className="ml-2 bg-muted px-2 py-1 rounded">{searchState.query}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expanded:</span>
                          <code className="ml-2 bg-muted px-2 py-1 rounded">{processedQuery.expandedQuery}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Categories:</span>
                          <span className="ml-2">
                            {processedQuery.detectedCategories.length > 0 
                              ? processedQuery.detectedCategories.join(', ')
                              : 'None detected'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Complexity:</span>
                          <Badge 
                            variant="outline" 
                            className="ml-2"
                          >
                            {processedQuery.metadata.complexity}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Search Results */}
            {searchState.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching knowledge base...</p>
                </div>
              </div>
            ) : searchState.error ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
                    <p className="text-destructive font-medium mb-2">Search Error</p>
                    <p className="text-muted-foreground">{searchState.error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : searchState.results.length > 0 ? (
              <div className="space-y-4">
                {searchState.results.map(renderSearchResult)}
                
                {/* Pagination */}
                {searchState.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => performSearch(searchState.query, searchState.currentPage - 1)}
                      disabled={searchState.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, searchState.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={searchState.currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => performSearch(searchState.query, page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => performSearch(searchState.query, searchState.currentPage + 1)}
                      disabled={searchState.currentPage === searchState.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : searchState.query ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No results found for "{searchState.query}"</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search Knowledge Base</h3>
                <p className="text-muted-foreground mb-6">
                  Find articles, videos, courses, and more from our comprehensive Islamic knowledge base
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['prayer times', 'five pillars', 'halal food', 'quranic arabic', 'islamic finance'].map(suggestion => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      onClick={() => handleSearchChange(suggestion)}
                      className="gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
