"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'audio' | 'book' | 'pdf';
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
  summary?: string;
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
}

interface SearchQuery {
  id: string;
  name: string;
  search_query: string;
  filters: SearchFilters;
  created_at: string;
}

interface SearchHistory {
  id: string;
  search_query: string;
  created_at: string;
  result_count: number;
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  type: 'trending' | 'similar' | 'recent' | 'editorial' | 'related';
  score: number;
  content: SearchResult;
}

interface Synonym {
  term: string;
  synonyms: string[];
  category: string;
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
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'pdf', label: 'PDF', icon: File },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'text-green-600' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600' },
  { value: 'advanced', label: 'Advanced', color: 'text-orange-600' },
  { value: 'scholar', label: 'Scholar', color: 'text-red-600' },
];

const SYNONYMS: Synonym[] = [
  {
    term: 'prayer',
    synonyms: ['salah', 'namaz', 'salat', 'worship'],
    category: 'worship'
  },
  {
    term: 'fasting',
    synonyms: ['sawm', 'roza', 'siyam', 'abstinence'],
    category: 'worship'
  },
  {
    term: 'charity',
    synonyms: ['zakat', 'sadaqah', 'alms', 'donation'],
    category: 'worship'
  },
  {
    term: 'pilgrimage',
    synonyms: ['hajj', 'umrah', 'journey', 'visit'],
    category: 'worship'
  },
  {
    term: 'faith',
    synonyms: ['iman', 'belief', 'conviction', 'trust'],
    category: 'aqeedah'
  },
  {
    term: 'prophet',
    synonyms: ['nabi', 'rasul', 'messenger', 'apostle'],
    category: 'prophets'
  },
  {
    term: 'quran',
    synonyms: ['koran', 'quran', 'holy book', 'scripture'],
    category: 'quran'
  },
  {
    term: 'hadith',
    synonyms: ['sunnah', 'tradition', 'narration', 'report'],
    category: 'hadith'
  },
  {
    term: 'jurisprudence',
    synonyms: ['fiqh', 'law', 'legal', 'rulings'],
    category: 'fiqh'
  },
  {
    term: 'creed',
    synonyms: ['aqeedah', 'belief', 'doctrine', 'tenets'],
    category: 'aqeedah'
  }
];

export default function SmartSearch() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedQueries, setSavedQueries] = useState<SearchQuery[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchOperators, setSearchOperators] = useState({
    and: true,
    or: false,
    not: false,
    exact: false
  });
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'views'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Load search history and saved queries
  useEffect(() => {
    loadSearchHistory();
    loadSavedQueries();
    loadRecommendations();
  }, []);

  // Load search history
  const loadSearchHistory = async () => {
    try {
      const { data } = await supabase
        .from('user_search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Load saved queries
  const loadSavedQueries = async () => {
    try {
      const { data } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });
      
      setSavedQueries(data || []);
    } catch (error) {
      console.error('Error loading saved queries:', error);
    }
  };

  // Load recommendations
  const loadRecommendations = async () => {
    try {
      // Get trending content
      const { data: trending } = await supabase
        .from('content')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(5);

      // Get recently viewed
      const { data: recent } = await supabase
        .from('user_content_views')
        .select('content_id, content(*)')
        .order('viewed_at', { ascending: false })
        .limit(5);

      // Get editorial picks
      const { data: editorial } = await supabase
        .from('content')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const recs: Recommendation[] = [
        ...(trending || []).map((item, index) => ({
          id: `trending-${item.id}`,
          title: item.title,
          reason: 'Trending in your community',
          type: 'trending' as const,
          score: 100 - index * 10,
          content: item as SearchResult
        })),
        ...(recent || []).map((item, index) => ({
          id: `recent-${item.content_id}`,
          title: item.content?.title || '',
          reason: 'Recently viewed',
          type: 'recent' as const,
          score: 80 - index * 5,
          content: item.content as SearchResult
        })),
        ...(editorial || []).map((item, index) => ({
          id: `editorial-${item.id}`,
          title: item.title,
          reason: 'Scholar recommended',
          type: 'editorial' as const,
          score: 90 - index * 5,
          content: item as SearchResult
        }))
      ];

      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  // Build search query with operators
  const buildSearchQuery = (query: string): string => {
    let searchQuery = query.trim();
    
    if (searchOperators.exact) {
      searchQuery = `"${searchQuery}"`;
    }
    
    if (searchOperators.and) {
      searchQuery = searchQuery.split(' ').join(' & ');
    }
    
    if (searchOperators.or) {
      searchQuery = searchQuery.split(' ').join(' | ');
    }
    
    if (searchOperators.not) {
      searchQuery = searchQuery.split(' ').map(term => `!${term}`).join(' ');
    }
    
    return searchQuery;
  };

  // Expand query with synonyms
  const expandQueryWithSynonyms = (query: string): string => {
    const terms = query.toLowerCase().split(' ');
    const expandedTerms = terms.map(term => {
      const synonym = SYNONYMS.find(s => s.term === term || s.synonyms.includes(term));
      if (synonym) {
        return `(${term} | ${synonym.synonyms.join(' | ')})`;
      }
      return term;
    });
    
    return expandedTerms.join(' & ');
  };

  // Perform search
  const performSearch = async (query: string, filters: SearchFilters = {}) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Build the search query
      let searchQuery = buildSearchQuery(query);
      
      // Expand with synonyms
      searchQuery = expandQueryWithSynonyms(searchQuery);
      
      // Build filter conditions
      let filterConditions: any = {};
      
      if (filters.madhab) {
        filterConditions.madhab = filters.madhab;
      }
      
      if (filters.language) {
        filterConditions.language = filters.language;
      }
      
      if (filters.type) {
        filterConditions.type = filters.type;
      }
      
      if (filters.difficulty) {
        filterConditions.difficulty = filters.difficulty;
      }
      
      if (filters.isVerified !== undefined) {
        filterConditions.is_verified = filters.isVerified;
      }
      
      if (filters.isFeatured !== undefined) {
        filterConditions.is_featured = filters.isFeatured;
      }
      
      if (filters.rating) {
        filterConditions.rating = { gte: filters.rating };
      }
      
      if (filters.dateRange) {
        const now = new Date();
        const days = parseInt(filters.dateRange);
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filterConditions.created_at = { gte: startDate.toISOString() };
      }
      
      // Build tag filters
      if (filters.tags && filters.tags.length > 0) {
        filterConditions.tags = { cs: filters.tags };
      }
      
      if (filters.excludeTags && filters.excludeTags.length > 0) {
        filterConditions.tags = { not: { cs: filters.excludeTags } };
      }
      
      // Perform full-text search
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          scholar:profiles!content_scholar_id_fkey(full_name, username),
          category:content_categories(name)
        `)
        .textSearch('search_vector', searchQuery)
        .match(filterConditions)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSearchResults(data || []);
      
      // Save to search history
      await supabase
        .from('user_search_history')
        .insert({
          search_query: query,
          result_count: data?.length || 0,
          filters: filters
        });
      
      // Reload search history
      loadSearchHistory();
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    await performSearch(searchQuery, filters);
  }, [searchQuery, filters]);

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle tag toggle
  const handleTagToggle = (tag: string, isExcluded: boolean = false) => {
    if (isExcluded) {
      setExcludedTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    } else {
      setSelectedTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    }
  };

  // Save search query
  const saveSearchQuery = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          name: `Search: ${searchQuery.substring(0, 50)}...`,
          search_query: searchQuery,
          filters: filters
        });
      
      if (error) throw error;
      
      toast.success('Search query saved');
      loadSavedQueries();
    } catch (error) {
      console.error('Error saving query:', error);
      toast.error('Failed to save search query');
    }
  };

  // Load saved query
  const loadSavedQuery = (savedQuery: SearchQuery) => {
    setSearchQuery(savedQuery.search_query);
    setFilters(savedQuery.filters);
    performSearch(savedQuery.search_query, savedQuery.filters);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSelectedTags([]);
    setExcludedTags([]);
  };

  // Sort results
  const sortResults = (results: SearchResult[]) => {
    return [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          // This would be handled by PostgreSQL full-text search ranking
          comparison = 0;
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'views':
          comparison = a.view_count - b.view_count;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Smart Search & Discovery
        </h1>
        <p className="text-muted-foreground">
          Find Islamic knowledge with advanced search and intelligent recommendations
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search for articles, videos, books, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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

        {/* Search Operators */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Search Mode:</Label>
            <div className="flex gap-2">
              <Button
                variant={searchOperators.and ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchOperators({ and: true, or: false, not: false, exact: false })}
              >
                AND
              </Button>
              <Button
                variant={searchOperators.or ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchOperators({ and: false, or: true, not: false, exact: false })}
              >
                OR
              </Button>
              <Button
                variant={searchOperators.not ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchOperators({ and: false, or: false, not: true, exact: false })}
              >
                NOT
              </Button>
              <Button
                variant={searchOperators.exact ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchOperators({ and: false, or: false, not: false, exact: true })}
              >
                "Exact"
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border rounded-lg bg-muted/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Madhab Filter */}
              <div>
                <Label>Madhab</Label>
                <Select
                  value={filters.madhab || ''}
                  onValueChange={(value) => handleFilterChange('madhab', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Madhab" />
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

              {/* Language Filter */}
              <div>
                <Label>Language</Label>
                <Select
                  value={filters.language || ''}
                  onValueChange={(value) => handleFilterChange('language', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
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

              {/* Content Type Filter */}
              <div>
                <Label>Content Type</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => handleFilterChange('type', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={filters.difficulty || ''}
                  onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Difficulty" />
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

              {/* Date Range Filter */}
              <div>
                <Label>Date Range</Label>
                <Select
                  value={filters.dateRange || ''}
                  onValueChange={(value) => handleFilterChange('dateRange', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
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
                    <SelectValue placeholder="Select Rating" />
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

            {/* Tag Filters */}
            <div className="mt-4">
              <Label>Include Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Quran', 'Hadith', 'Fiqh', 'Aqeedah', 'Seerah', 'Tafsir', 'Salah', 'Zakat', 'Hajj', 'Ramadan'].map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag, false)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Label>Exclude Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Politics', 'Controversial', 'Modern', 'Traditional', 'Academic'].map(tag => (
                  <Button
                    key={tag}
                    variant={excludedTags.includes(tag) ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag, true)}
                  >
                    {tag}
                  </Button>
                ))}
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

      {/* Search Results Header */}
      {searchResults.length > 0 && (
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              Search Results ({searchResults.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={saveSearchQuery}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
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
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
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
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {sortResults(searchResults).map((result) => {
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
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {result.title}
                          </h3>
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
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {result.summary || result.content}
                    </p>

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
                        <p className="font-semibold text-foreground">{result.view_count}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-foreground">{result.rating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
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
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommendations</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {rec.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {rec.reason}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {rec.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{rec.content.view_count}</span>
                    </div>
                    <Button size="sm">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((history) => (
              <Button
                key={history.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(history.search_query);
                  handleSearch();
                }}
              >
                <History className="w-4 h-4 mr-2" />
                {history.search_query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Saved Queries */}
      {savedQueries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Saved Searches</h2>
          <div className="space-y-2">
            {savedQueries.map((query) => (
              <Card key={query.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{query.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {query.search_query} • {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedQuery(query)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Delete saved query
                        setSavedQueries(prev => prev.filter(q => q.id !== query.id));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isSearching && searchQuery && (
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
    </div>
  );
}
