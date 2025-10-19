"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Search,
  Filter,
  Clock,
  Star,
  Bookmark,
  History,
  TrendingUp,
  Users,
  Eye,
  Tag,
  Calendar,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Minus,
  Save,
  Trash2,
  Copy,
  Share2,
  Download,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Zap,
  Target,
  Lightbulb,
  BookOpen,
  FileText,
  Video,
  Headphones,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Award,
  BookmarkCheck,
  Clock3,
  User,
  MapPin,
  Languages,
  GraduationCap,
  Calendar as CalendarIcon,
  Timer,
  Hash,
  Heart,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  summary: string;
  type: 'article' | 'video' | 'audio' | 'book' | 'pdf' | 'course';
  author: string;
  scholar_id?: string;
  madhab?: string;
  language: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  share_count: number;
  beneficial_count: number;
  rating: number;
  thumbnail_url?: string;
  duration?: number;
  word_count?: number;
  reading_time?: number;
  is_featured: boolean;
  is_verified: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'scholar';
  category: string;
  subcategory?: string;
  related_content?: string[];
  citations?: string[];
}

interface SearchFilters {
  madhab?: string;
  language?: string;
  type?: string;
  difficulty?: string;
  dateRange?: string;
  rating?: number;
  tags?: string[];
  excludeTags?: string[];
  scholar?: string;
  category?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  duration?: string;
  author?: string;
}

interface SearchSuggestion {
  id: string;
  query: string;
  type: 'recent' | 'saved' | 'popular' | 'suggested';
  frequency?: number;
  timestamp?: string;
}

interface RelatedContent {
  id: string;
  title: string;
  type: string;
  reason: string;
  strength: number;
}

const MADHABS = [
  { value: 'hanafi', label: 'Hanafi' },
  { value: 'maliki', label: 'Maliki' },
  { value: 'shafi', label: 'Shafi\'i' },
  { value: 'hanbali', label: 'Hanbali' },
  { value: 'jaafari', label: 'Ja\'afari' },
  { value: 'zahiri', label: 'Zahiri' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ur', label: 'Urdu' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ms', label: 'Malay' },
  { value: 'fr', label: 'French' },
];

const CONTENT_TYPES = [
  { value: 'article', label: 'Article', icon: FileText, color: 'text-blue-600' },
  { value: 'video', label: 'Video', icon: Video, color: 'text-red-600' },
  { value: 'audio', label: 'Audio', icon: Headphones, color: 'text-green-600' },
  { value: 'book', label: 'Book', icon: BookOpen, color: 'text-purple-600' },
  { value: 'pdf', label: 'PDF', icon: File, color: 'text-gray-600' },
  { value: 'course', label: 'Course', icon: GraduationCap, color: 'text-orange-600' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'advanced', label: 'Advanced', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'scholar', label: 'Scholar', color: 'text-red-600', bg: 'bg-red-100' },
];

const DURATION_OPTIONS = [
  { value: 'short', label: 'Under 5 min' },
  { value: 'medium', label: '5-15 min' },
  { value: 'long', label: '15-30 min' },
  { value: 'extended', label: '30+ min' },
];

const DATE_RANGES = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'quarter', label: 'Last 3 months' },
  { value: 'year', label: 'Last year' },
  { value: 'all', label: 'All time' },
];


export function EnhancedSearch() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'views' | 'beneficial'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(12);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  
  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load search suggestions
  const loadSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      // Get recent searches
      const { data: recentSearches } = await supabase
        .from('user_search_history')
        .select('search_query')
        .ilike('search_query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get saved searches
      const { data: savedSearches } = await supabase
        .from('saved_searches')
        .select('name, search_query')
        .or(`name.ilike.%${query}%,search_query.ilike.%${query}%`)
        .limit(3);

      // Get popular searches
      const { data: popularSearches } = await supabase
        .from('user_search_history')
        .select('search_query')
        .ilike('search_query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(3);

      const suggestionList: SearchSuggestion[] = [
        ...(recentSearches || []).map((search, index) => ({
          id: `recent-${index}`,
          query: search.search_query,
          type: 'recent' as const,
          timestamp: new Date().toISOString(),
        })),
        ...(savedSearches || []).map((search, index) => ({
          id: `saved-${index}`,
          query: search.search_query,
          type: 'saved' as const,
        })),
        ...(popularSearches || []).map((search, index) => ({
          id: `popular-${index}`,
          query: search.search_query,
          type: 'popular' as const,
          frequency: Math.floor(Math.random() * 100),
        })),
      ];

      setSuggestions(suggestionList.slice(0, 8));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [supabase]);

  // Load suggestions when query changes
  useEffect(() => {
    if (debouncedQuery) {
      loadSuggestions(debouncedQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, loadSuggestions]);

  // Perform search
  const performSearch = async (query: string, filters: SearchFilters = {}) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    const startTime = Date.now();
    
    try {
      // Build filter conditions
      let filterConditions: any = {};
      
      if (filters.madhab) filterConditions.madhab = filters.madhab;
      if (filters.language) filterConditions.language = filters.language;
      if (filters.type) filterConditions.type = filters.type;
      if (filters.difficulty) filterConditions.difficulty = filters.difficulty;
      if (filters.isVerified !== undefined) filterConditions.is_verified = filters.isVerified;
      if (filters.isFeatured !== undefined) filterConditions.is_featured = filters.isFeatured;
      if (filters.rating) filterConditions.rating = { gte: filters.rating };
      
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        const days = filters.dateRange === 'week' ? 7 : 
                   filters.dateRange === 'month' ? 30 : 
                   filters.dateRange === 'quarter' ? 90 : 365;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filterConditions.created_at = { gte: startDate.toISOString() };
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filterConditions.tags = { cs: filters.tags };
      }
      
      if (filters.excludeTags && filters.excludeTags.length > 0) {
        filterConditions.tags = { not: { cs: filters.excludeTags } };
      }
      
      // Perform full-text search
      const { data, error, count } = await supabase
        .from('content')
        .select(`
          *,
          scholar:profiles!content_scholar_id_fkey(full_name, username),
          category:content_categories(name)
        `, { count: 'exact' })
        .textSearch('search_vector', query)
        .match(filterConditions)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage - 1);
      
      if (error) throw error;
      
      setSearchResults(data || []);
      setTotalResults(count || 0);
      setSearchTime(Date.now() - startTime);
      
      // Save to search history
      await supabase
        .from('user_search_history')
        .insert({
          search_query: query,
          result_count: data?.length || 0,
          filters: filters
        });
      
      // Load related content
      loadRelatedContent(data?.[0]?.id);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Load related content
  const loadRelatedContent = async (contentId?: string) => {
    if (!contentId) return;
    
    try {
      // Get content relationships
      const { data: relationships } = await supabase
        .rpc('get_content_relationships', {
          content_id: contentId,
          limit_count: 5
        });

      // Get editorial picks
      const { data: editorialPicks } = await supabase
        .rpc('get_editorial_picks', {
          limit_count: 3
        });

      const related: RelatedContent[] = [
        ...(relationships || []).map((rel: any) => ({
          id: rel.related_id,
          title: rel.title,
          type: 'related',
          reason: `Related content (${rel.relationship_type})`,
          strength: rel.strength,
        })),
        ...(editorialPicks || []).map((pick: any) => ({
          id: pick.content_id,
          title: pick.title,
          type: 'editorial',
          reason: 'Editorial pick',
          strength: pick.priority,
        })),
      ];

      setRelatedContent(related);
    } catch (error) {
      console.error('Error loading related content:', error);
    }
  };

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setCurrentPage(1);
    await performSearch(searchQuery, filters);
  }, [searchQuery, filters]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.query);
    setShowSuggestions(false);
    performSearch(suggestion.query, filters);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    const contentType = CONTENT_TYPES.find(t => t.value === type);
    return contentType?.icon || FileText;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    const level = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
    return level?.color || 'text-gray-600';
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  // Search Bar Component
  const SearchBar = () => (
    <div className="relative mb-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search for articles, videos, books, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-20"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50"
          >
            <div className="p-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full text-left p-2 hover:bg-muted rounded flex items-center gap-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'recent' && <History className="w-4 h-4 text-muted-foreground" />}
                  {suggestion.type === 'saved' && <Bookmark className="w-4 h-4 text-muted-foreground" />}
                  {suggestion.type === 'popular' && <TrendingUp className="w-4 h-4 text-muted-foreground" />}
                  {suggestion.type === 'suggested' && <Lightbulb className="w-4 h-4 text-muted-foreground" />}
                  <span className="flex-1">{suggestion.query}</span>
                  {suggestion.frequency && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.frequency}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Operators Helper */}
      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p><strong>Search Operators:</strong></p>
                <p>• Use quotes for exact phrases: "prayer times"</p>
                <p>• Use AND, OR, NOT for boolean search</p>
                <p>• Use * for wildcards: pray*</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span>Search operators: "exact phrase", AND, OR, NOT, *wildcard</span>
      </div>
    </div>
  );

  // Filter Panel Component
  const FilterPanel = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 border rounded-lg bg-muted/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            <div>
              <Label>Content Type</Label>
              <Select
                value={filters.type || ''}
                onValueChange={(value) => handleFilterChange('type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scholar/Author Filter */}
            <div>
              <Label>Scholar/Author</Label>
              <Input
                placeholder="Search by author..."
                value={filters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value || undefined)}
              />
            </div>

            {/* Difficulty Level Filter */}
            <div>
              <Label>Difficulty Level</Label>
              <Select
                value={filters.difficulty || ''}
                onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Filter */}
            <div>
              <Label>Language</Label>
              <Select
                value={filters.language || ''}
                onValueChange={(value) => handleFilterChange('language', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={filters.dateRange || ''}
                onValueChange={(value) => handleFilterChange('dateRange', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Time</SelectItem>
                  {DATE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Madhab Filter */}
            <div>
              <Label>Madhab</Label>
              <Select
                value={filters.madhab || ''}
                onValueChange={(value) => handleFilterChange('madhab', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Madhabs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Madhabs</SelectItem>
                  {MADHABS.map(madhab => (
                    <SelectItem key={madhab.value} value={madhab.value}>
                      {madhab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Filter */}
            <div>
              <Label>Duration</Label>
              <Select
                value={filters.duration || ''}
                onValueChange={(value) => handleFilterChange('duration', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Duration</SelectItem>
                  {DURATION_OPTIONS.map(duration => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div>
              <Label>Minimum Rating</Label>
              <Select
                value={filters.rating?.toString() || ''}
                onValueChange={(value) => handleFilterChange('rating', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Rating</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleSearch}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Search Results Component
  const SearchResults = () => (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Search Results ({totalResults.toLocaleString()})
          </h2>
          <span className="text-sm text-muted-foreground">
            Found in {searchTime}ms
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by:</Label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Newest</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="beneficial">Most Beneficial</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      {searchResults.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {searchResults.map((result) => {
            const TypeIcon = getContentTypeIcon(result.type);
            const difficultyColor = getDifficultyColor(result.difficulty);
            
            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={viewMode === 'grid' ? '' : 'flex gap-4'}
              >
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <TypeIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold text-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(result.title, searchQuery) 
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            by {result.author}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p 
                      className="text-sm text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(result.summary || result.content, searchQuery) 
                      }}
                    />

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {result.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {result.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-foreground">{result.view_count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-foreground">{result.beneficial_count}</p>
                        <p className="text-xs text-muted-foreground">Beneficial</p>
                      </div>
                    </div>

                    {/* Difficulty and Language */}
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-medium ${difficultyColor}`}>
                        {result.difficulty}
                      </span>
                      <span className="text-muted-foreground">
                        {result.language.toUpperCase()}
                      </span>
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
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No results found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalResults > resultsPerPage && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalResults / resultsPerPage), prev + 1))}
            disabled={currentPage >= Math.ceil(totalResults / resultsPerPage)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // Related Content Sidebar
  const RelatedContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Related Content</h3>
      
      {/* People Also Viewed */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">People Also Viewed</h4>
        <div className="space-y-2">
          {relatedContent.slice(0, 3).map((content) => (
            <Card key={content.id} className="p-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{content.title}</p>
                  <p className="text-xs text-muted-foreground">{content.reason}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Editorial Picks */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Editorial Picks</h4>
        <div className="space-y-2">
          {relatedContent.filter(c => c.type === 'editorial').slice(0, 2).map((content) => (
            <Card key={content.id} className="p-3 border-l-4 border-l-primary">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{content.title}</p>
                  <p className="text-xs text-muted-foreground">Scholar recommended</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Enhanced Search
        </h1>
        <p className="text-muted-foreground">
          Find Islamic knowledge with advanced search and intelligent recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <SearchBar />
          <FilterPanel />
          <SearchResults />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <RelatedContent />
        </div>
      </div>
    </div>
  );
}
