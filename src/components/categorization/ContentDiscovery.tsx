"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Star,
  Eye,
  ThumbsUp,
  Share,
  Bookmark,
  Clock,
  User,
  Tag,
  Globe,
  TrendingUp,
  Sparkles,
  BookOpen,
  MessageSquare,
  Scale,
  Heart,
  Users,
  Languages,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Settings,
  Zap,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Flame,
  Snowflake,
  Thermometer,
  Umbrella,
  TreePine,
  TreeDeciduous,
  Flower,
  Leaf,
  Sprout,
  Seedling,
  Cactus,
  PalmTree,
  Mountain,
  Waves,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Squirrel,
  Butterfly,
  Bee,
  Ant,
  Spider,
  Ladybug,
  Dragonfly,
  Firefly,
  Snail,
  Turtle,
  Frog,
  Lizard,
  Snake,
  Mouse,
  Hamster,
  GuineaPig,
  Hedgehog,
  Fox,
  Wolf,
  Bear,
  Lion,
  Tiger,
  Elephant,
  Giraffe,
  Zebra,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Turkey,
  Peacock,
  Owl,
  Eagle,
  Hawk,
  Falcon,
  Parrot,
  Toucan,
  Flamingo,
  Penguin,
  Seal,
  Whale,
  Dolphin,
  Shark,
  Octopus,
  Jellyfish,
  Crab,
  Lobster,
  Shrimp,
  Clam,
  Oyster,
  Starfish,
  SeaUrchin,
  Coral,
  Seaweed,
  Algae,
  Moss,
  Fern,
  Bamboo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { contentTaxonomy } from "@/lib/categorization/taxonomy";
import { contentDiscoveryEngine, SearchQuery, SearchResult, ContentItem } from "@/lib/categorization/discovery";
import CategorySelector from "./CategorySelector";

interface ContentDiscoveryProps {
  userId?: string;
  onContentSelect?: (content: ContentItem) => void;
  showFilters?: boolean;
  showRecommendations?: boolean;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance", icon: Target },
  { value: "date", label: "Date", icon: Clock },
  { value: "views", label: "Views", icon: Eye },
  { value: "likes", label: "Likes", icon: ThumbsUp },
  { value: "quality", label: "Quality", icon: Star },
  { value: "title", label: "Title", icon: BookOpen },
];

const VIEW_OPTIONS = [
  { value: "grid", label: "Grid", icon: Grid },
  { value: "list", label: "List", icon: List },
];

export default function ContentDiscovery({
  userId,
  onContentSelect,
  showFilters = true,
  showRecommendations = true,
}: ContentDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    loadInitialContent();
  }, []);

  useEffect(() => {
    if (searchQuery.text || selectedCategories.length > 0 || selectedTags.length > 0) {
      performSearch();
    }
  }, [searchQuery, selectedCategories, selectedTags]);

  const loadInitialContent = async () => {
    try {
      setLoading(true);
      
      // Load recommendations
      if (userId && showRecommendations) {
        const userRecommendations = await contentDiscoveryEngine.getPersonalizedRecommendations(userId, 6);
        setRecommendations(userRecommendations);
      }
      
      // Load trending content
      const trending = await contentDiscoveryEngine.getTrendingContent(undefined, 6);
      setTrendingContent(trending);
      
      // Load featured content
      const featured = await contentDiscoveryEngine.getFeaturedContent(6);
      setFeaturedContent(featured);
    } catch (error) {
      console.error("Error loading initial content:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      
      const query: SearchQuery = {
        ...searchQuery,
        filters: {
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        },
        limit: 20,
        offset: 0,
      };
      
      const results = await contentDiscoveryEngine.searchContent(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(prev => ({ ...prev, text }));
  };

  const handleSortChange = (sortBy: string) => {
    setSearchQuery(prev => ({ ...prev, sortBy: sortBy as any }));
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
    return category?.icon || "BookOpen";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
    return category?.color || "#6B7280";
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderContentCard = (content: ContentItem, index: number) => {
    const categoryColor = getCategoryColor(content.category);
    const categoryIcon = getCategoryIcon(content.category);
    
    return (
      <motion.div
        key={content.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`${viewMode === "grid" ? "col-span-1" : "col-span-full"}`}
      >
        <Card 
          className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={() => onContentSelect?.(content)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2">{content.title}</h3>
                  <p className="text-sm text-muted-foreground">By {content.author}</p>
                </div>
              </div>
              {content.isFeatured && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  {contentTaxonomy.mainCategories.find(cat => cat.id === content.category)?.name}
                </Badge>
                {content.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {content.subcategory}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {content.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
                {content.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{content.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{content.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{content.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share className="w-4 h-4" />
                  <span>{content.shares}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{content.qualityScore}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatDuration(content.metadata.duration)}</span>
                <span>•</span>
                <span>{formatDate(content.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {content.metadata.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {content.metadata.format}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {content.language}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm">
                  <Bookmark className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search content, authors, or topics..."
              value={searchQuery.text || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Sort and View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <select
              value={searchQuery.sortBy || "relevance"}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1 border border-border rounded-md bg-background text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            <div className="flex border border-border rounded-md">
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={viewMode === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(option.value as "grid" | "list")}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  <option.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-border rounded-lg p-4"
        >
          <CategorySelector
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedSubcategories={selectedSubcategories}
            onSubcategoriesChange={setSelectedSubcategories}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            showAdvanced={true}
          />
        </motion.div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Search Results ({searchResults.total})
            </h2>
            {searchResults.suggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Suggestions:</span>
                {searchResults.suggestions.slice(0, 3).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary-50"
                    onClick={() => handleSearch(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {searchResults.items.map((content, index) => renderContentCard(content, index))}
            </div>
          )}

          {/* Related Content */}
          {searchResults.relatedContent.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Related Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.relatedContent.map((content, index) => renderContentCard(content, index))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations and Trending Content */}
      {!searchResults && (
        <div className="space-y-8">
          {/* Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-foreground">Recommended for You</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((content, index) => renderContentCard(content, index))}
              </div>
            </div>
          )}

          {/* Trending Content */}
          {trendingContent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-foreground">Trending Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingContent.map((content, index) => renderContentCard(content, index))}
              </div>
            </div>
          )}

          {/* Featured Content */}
          {featuredContent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-foreground">Featured Content</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredContent.map((content, index) => renderContentCard(content, index))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
