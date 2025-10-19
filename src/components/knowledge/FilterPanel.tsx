"use client";

import { motion } from "framer-motion";
import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ContentType = "all" | "article" | "video" | "book";
type Difficulty = "all" | "beginner" | "intermediate" | "advanced";
type SortBy = "recent" | "popular" | "rating" | "title";

interface FilterPanelProps {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  onClose: () => void;
}

const CONTENT_TYPES = [
  { id: "all", label: "All Content", icon: "📚", count: 779 },
  { id: "article", label: "Articles", icon: "📄", count: 456 },
  { id: "video", label: "Videos", icon: "🎥", count: 234 },
  { id: "book", label: "Books", icon: "📖", count: 89 },
] as const;

const DIFFICULTY_LEVELS = [
  { id: "all", label: "All Levels", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { id: "beginner", label: "Beginner", color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  { id: "intermediate", label: "Intermediate", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
  { id: "advanced", label: "Advanced", color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
] as const;

const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "recent", label: "Most Recent" },
  { id: "rating", label: "Highest Rated" },
  { id: "title", label: "Alphabetical" },
] as const;

const CATEGORIES = [
  { id: "quran", name: "Quran", count: 156 },
  { id: "hadith", name: "Hadith", count: 89 },
  { id: "fiqh", name: "Fiqh", count: 124 },
  { id: "aqeedah", name: "Aqeedah", count: 67 },
  { id: "seerah", name: "Seerah", count: 45 },
  { id: "spirituality", name: "Spirituality", count: 78 },
  { id: "contemporary", name: "Contemporary", count: 92 },
  { id: "family", name: "Family", count: 34 },
];

const SCHOLARS = [
  { id: "sheikh_ahmad", name: "Sheikh Ahmad Al-Maliki", count: 45 },
  { id: "dr_fatima", name: "Dr. Fatima Rahman", count: 32 },
  { id: "sheikh_yusuf", name: "Sheikh Yusuf Al-Qaradawi", count: 28 },
  { id: "dr_omar", name: "Dr. Omar Hassan", count: 23 },
  { id: "sheikh_amina", name: "Sheikh Amina Ibrahim", count: 19 },
];

export function FilterPanel({
  contentType,
  setContentType,
  difficulty,
  setDifficulty,
  sortBy,
  setSortBy,
  onClose,
}: FilterPanelProps) {
  const clearAllFilters = () => {
    setContentType("all");
    setDifficulty("all");
    setSortBy("popular");
  };

  const hasActiveFilters = contentType !== "all" || difficulty !== "all" || sortBy !== "popular";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-lg shadow-md border border-border p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Content Type */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Content Type</h4>
          <div className="space-y-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id as ContentType)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                  contentType === type.id
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border hover:border-primary-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {type.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Difficulty Level</h4>
          <div className="space-y-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id as Difficulty)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  difficulty === level.id
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border hover:border-primary-300"
                }`}
              >
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                  {level.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Sort By</h4>
          <div className="space-y-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as SortBy)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  sortBy === option.id
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border hover:border-primary-300"
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Quick Filters</h4>
          <div className="space-y-3">
            {/* Categories */}
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Popular Categories</h5>
              <div className="space-y-1">
                {CATEGORIES.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    className="flex items-center justify-between w-full p-2 rounded text-sm hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scholars */}
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Top Scholars</h5>
              <div className="space-y-1">
                {SCHOLARS.slice(0, 3).map((scholar) => (
                  <button
                    key={scholar.id}
                    className="flex items-center justify-between w-full p-2 rounded text-sm hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground truncate">{scholar.name}</span>
                    <span className="text-xs text-muted-foreground">{scholar.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {contentType !== "all" && (
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                {CONTENT_TYPES.find(t => t.id === contentType)?.label}
              </span>
            )}
            {difficulty !== "all" && (
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.label}
              </span>
            )}
            {sortBy !== "popular" && (
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
