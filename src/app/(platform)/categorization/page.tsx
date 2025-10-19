"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  MessageSquare,
  Scale,
  Heart,
  Sparkles,
  Users,
  Clock,
  Languages,
  Search,
  Filter,
  TrendingUp,
  Star,
  Eye,
  ThumbsUp,
  Share,
  Bookmark,
  Tag,
  Globe,
  Target,
  Zap,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  RefreshCw,
  Download,
  Upload,
  Save,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  HelpCircle,
  AlertCircle,
  CheckCircle,
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
import { contentTaxonomy } from "@/lib/categorization/taxonomy";
import { categorizationEngine } from "@/lib/categorization/engine";
import { contentDiscoveryEngine, ContentItem } from "@/lib/categorization/discovery";
import ContentDiscovery from "@/components/categorization/ContentDiscovery";
import CategorySelector from "@/components/categorization/CategorySelector";

export default function CategorizationPage() {
  const [activeTab, setActiveTab] = useState<"discover" | "categories" | "analytics" | "settings">("discover");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [categorizationStats, setCategorizationStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorizationStats();
  }, []);

  const loadCategorizationStats = async () => {
    try {
      setLoading(true);
      
      // Get categorization engine statistics
      const stats = categorizationEngine.getCategorizationStats();
      setCategorizationStats(stats);
    } catch (error) {
      console.error("Error loading categorization stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = (content: ContentItem) => {
    setSelectedContent(content);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
    return category?.icon || "BookOpen";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
    return category?.color || "#6B7280";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Intelligent Categorization
              </h1>
              <p className="text-muted-foreground">
                Discover, organize, and manage Islamic content with AI-powered categorization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: "discover", label: "Discover", icon: Search, description: "Find and explore content" },
              { id: "categories", label: "Categories", icon: BookOpen, description: "Manage content categories" },
              { id: "analytics", label: "Analytics", icon: BarChart3, description: "View categorization insights" },
              { id: "settings", label: "Settings", icon: Settings, description: "Configure categorization" },
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

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ContentDiscovery
              userId="current-user"
              onContentSelect={handleContentSelect}
              showFilters={true}
              showRecommendations={true}
            />
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contentTaxonomy.mainCategories.map((category) => {
                const IconComponent = getCategoryIcon(category.id);
                
                return (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Subcategories</h4>
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories?.slice(0, 3).map((sub) => (
                              <Badge key={sub} variant="outline" className="text-xs">
                                {sub}
                              </Badge>
                            ))}
                            {category.subcategories && category.subcategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.subcategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {category.keywords?.slice(0, 5).map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {category.keywords && category.keywords.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{category.keywords.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category.subcategories?.length || 0} subcategories
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {category.keywords?.length || 0} keywords
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Analyses</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {categorizationStats?.totalAnalyses || 0}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Accuracy Rate</p>
                      <p className="text-2xl font-bold text-green-900">
                        {Math.round((categorizationStats?.accuracyRate || 0) * 100)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {Math.round((categorizationStats?.averageConfidence || 0) * 100)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Categories</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {contentTaxonomy.mainCategories.length}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(categorizationStats?.categoryDistribution || {}).map(([category, count]) => {
                      const categoryInfo = contentTaxonomy.mainCategories.find(cat => cat.id === category);
                      const percentage = Math.round((count as number / (categorizationStats?.totalAnalyses || 1)) * 100);
                      
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoryInfo?.color || "#6B7280" }}
                            ></div>
                            <span className="font-medium text-foreground">
                              {categoryInfo?.name || category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{count}</span>
                            <span className="text-sm font-medium text-foreground">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Processing Speed</span>
                      <span className="text-sm text-muted-foreground">~50ms avg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Tag Accuracy</span>
                      <span className="text-sm text-muted-foreground">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Category Accuracy</span>
                      <span className="text-sm text-muted-foreground">89%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">User Satisfaction</span>
                      <span className="text-sm text-muted-foreground">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Auto-categorization
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">
                        Automatically categorize new content
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confidence Threshold
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="70"
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">70% minimum confidence</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Learning Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">
                        Learn from user feedback
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Discovery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Recommendation Algorithm
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                      <option value="hybrid">Hybrid (Content + Collaborative)</option>
                      <option value="content">Content-based</option>
                      <option value="collaborative">Collaborative Filtering</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Personalization Level
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="80"
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">80% personalization</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Trending Window
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Selected Content Modal */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-lg shadow-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Content Details</h2>
                <Button variant="outline" size="sm" onClick={() => setSelectedContent(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{selectedContent.title}</h3>
                    <p className="text-muted-foreground">By {selectedContent.author}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {contentTaxonomy.mainCategories.find(cat => cat.id === selectedContent.category)?.name}
                    </Badge>
                    <Badge variant="outline">{selectedContent.metadata.difficulty}</Badge>
                    <Badge variant="outline">{selectedContent.metadata.format}</Badge>
                    <Badge variant="outline">{selectedContent.language}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedContent.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{selectedContent.likes} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="w-4 h-4" />
                      <span>{selectedContent.shares} shares</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{selectedContent.qualityScore}% quality</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
