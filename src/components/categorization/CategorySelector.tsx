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
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  Plus,
  Minus,
  Tag,
  Star,
  TrendingUp,
  Eye,
  ThumbsUp,
  Share,
  Bookmark,
  Flag,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Sparkles as SparklesIcon,
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
import { categorizationEngine } from "@/lib/categorization/engine";
import { contentDiscoveryEngine } from "@/lib/categorization/discovery";

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedSubcategories: string[];
  onSubcategoriesChange: (subcategories: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  showAdvanced?: boolean;
  onAdvancedToggle?: () => void;
}

const CATEGORY_ICONS = {
  quran: BookOpen,
  hadith: MessageSquare,
  fiqh: Scale,
  aqeedah: Heart,
  spirituality: Sparkles,
  practical: Users,
  history: Clock,
  arabic: Languages,
};

export default function CategorySelector({
  selectedCategories,
  onCategoriesChange,
  selectedSubcategories,
  onSubcategoriesChange,
  selectedTags,
  onTagsChange,
  showAdvanced = false,
  onAdvancedToggle,
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPopularTags();
  }, []);

  const loadPopularTags = async () => {
    try {
      setLoading(true);
      // Mock popular tags - in real implementation, this would come from the discovery engine
      const mockTags = [
        "islam", "quran", "hadith", "prayer", "fasting", "charity", "hajj",
        "prophet", "allah", "faith", "patience", "gratitude", "forgiveness",
        "family", "marriage", "parenting", "youth", "education", "knowledge"
      ];
      setPopularTags(mockTags);
    } catch (error) {
      console.error("Error loading popular tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
      // Remove subcategories when category is deselected
      const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
      if (category?.subcategories) {
        const subcategoriesToRemove = category.subcategories.filter(sub => 
          selectedSubcategories.includes(sub)
        );
        onSubcategoriesChange(selectedSubcategories.filter(sub => 
          !subcategoriesToRemove.includes(sub)
        ));
      }
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleSubcategoryToggle = (subcategory: string) => {
    if (selectedSubcategories.includes(subcategory)) {
      onSubcategoriesChange(selectedSubcategories.filter(sub => sub !== subcategory));
    } else {
      onSubcategoriesChange([...selectedSubcategories, subcategory]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCategoryExpand = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const filteredCategories = contentTaxonomy.mainCategories.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      category.subcategories?.some(sub => sub.toLowerCase().includes(query)) ||
      category.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  const getCategoryIcon = (categoryId: string) => {
    const IconComponent = CATEGORY_ICONS[categoryId as keyof typeof CATEGORY_ICONS] || BookOpen;
    return IconComponent;
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search categories, subcategories, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Categories Summary */}
      {(selectedCategories.length > 0 || selectedSubcategories.length > 0 || selectedTags.length > 0) && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-3">Selected Filters</h3>
          <div className="space-y-2">
            {selectedCategories.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCategories.map(categoryId => {
                    const category = contentTaxonomy.mainCategories.find(cat => cat.id === categoryId);
                    return (
                      <Badge
                        key={categoryId}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleCategoryToggle(categoryId)}
                      >
                        {category?.name}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedSubcategories.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Subcategories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSubcategories.map(subcategory => (
                    <Badge
                      key={subcategory}
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleTagToggle(subcategory)}
                    >
                      {subcategory}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedTags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Categories</h3>
          {onAdvancedToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdvancedToggle}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.id);
            const isSelected = selectedCategories.includes(category.id);
            const isExpanded = expandedCategories.includes(category.id);
            
            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary-500 bg-primary-50" : ""
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryExpand(category.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && category.subcategories && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="border-t border-border pt-3">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Subcategories</h5>
                        <div className="space-y-1">
                          {category.subcategories.map((subcategory) => (
                            <label
                              key={subcategory}
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubcategoryToggle(subcategory);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubcategories.includes(subcategory)}
                                onChange={() => {}} // Handled by onClick
                                className="rounded"
                              />
                              <span className="text-sm text-foreground">{subcategory}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Keywords */}
                  {showAdvanced && category.keywords && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">Related Keywords</h5>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.slice(0, 8).map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagToggle(keyword);
                            }}
                          >
                            {keyword}
                          </Badge>
                        ))}
                        {category.keywords.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.keywords.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      {showAdvanced && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Tags</h3>
          
          {/* Popular Tags */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Popular Tags</h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => handleTagToggle(tag)}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Add Custom Tags</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const tag = input.value.trim();
                    if (tag && !selectedTags.includes(tag)) {
                      onTagsChange([...selectedTags, tag]);
                      input.value = '';
                    }
                  }
                }}
              />
              <Button variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onCategoriesChange([]);
            onSubcategoriesChange([]);
            onTagsChange([]);
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Select all categories
            onCategoriesChange(contentTaxonomy.mainCategories.map(cat => cat.id));
          }}
        >
          <Check className="w-4 h-4 mr-2" />
          Select All
        </Button>
      </div>
    </div>
  );
}
