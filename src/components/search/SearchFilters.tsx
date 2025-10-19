"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Calendar,
  Check,
  FileText,
  Users,
  Video,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface SearchFilterState {
  dateRange: "all" | "day" | "week" | "month" | "year";
  contentType: string[];
  verified: "all" | "verified" | "unverified";
  tags: string[];
  sortBy: "relevance" | "recent" | "popular";
}

interface SearchFiltersProps {
  filters: SearchFilterState;
  onFiltersChange: (filters: SearchFilterState) => void;
  resultCount?: number;
}

const CONTENT_TYPES = [
  { id: "post", label: "Posts", icon: FileText },
  { id: "user", label: "People", icon: Users },
  { id: "halaqa", label: "Halaqas", icon: Users },
  { id: "article", label: "Articles", icon: BookOpen },
  { id: "video", label: "Videos", icon: Video },
];

const DATE_RANGES = [
  { id: "all", label: "All time" },
  { id: "day", label: "Past 24 hours" },
  { id: "week", label: "Past week" },
  { id: "month", label: "Past month" },
  { id: "year", label: "Past year" },
];

const SORT_OPTIONS = [
  { id: "relevance", label: "Most relevant" },
  { id: "recent", label: "Most recent" },
  { id: "popular", label: "Most popular" },
];

const POPULAR_TAGS = [
  "Quran",
  "Hadith",
  "Fiqh",
  "Ramadan",
  "Prayer",
  "Hajj",
  "Tafsir",
  "Seerah",
  "Spirituality",
  "Family",
];

export function SearchFilters({
  filters,
  onFiltersChange,
  resultCount,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const updateFilter = <K extends keyof SearchFilterState>(
    key: K,
    value: SearchFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleContentType = (type: string) => {
    const current = filters.contentType;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateFilter("contentType", updated);
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    updateFilter("tags", updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: "all",
      contentType: [],
      verified: "all",
      tags: [],
      sortBy: "relevance",
    });
  };

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    filters.contentType.length > 0 ||
    filters.verified !== "all" ||
    filters.tags.length > 0 ||
    filters.sortBy !== "relevance";

  const activeFilterCount =
    (filters.dateRange !== "all" ? 1 : 0) +
    filters.contentType.length +
    (filters.verified !== "all" ? 1 : 0) +
    filters.tags.length +
    (filters.sortBy !== "relevance" ? 1 : 0);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="relative"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-foreground">Filters</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {resultCount !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {resultCount} results found
                  </p>
                )}
              </div>

              {/* Filter Sections */}
              <div className="p-6 space-y-6">
                {/* Sort By */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Sort by</Label>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          updateFilter("sortBy", option.id as SearchFilterState["sortBy"])
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          filters.sortBy === option.id
                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="text-sm font-medium">{option.label}</span>
                        {filters.sortBy === option.id && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <button
                    onClick={() => toggleSection("date")}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date Range
                    </Label>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSection === "date" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSection === "date" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {DATE_RANGES.map((range) => (
                          <button
                            key={range.id}
                            onClick={() =>
                              updateFilter("dateRange", range.id as SearchFilterState["dateRange"])
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              filters.dateRange === range.id
                                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <span className="text-sm">{range.label}</span>
                            {filters.dateRange === range.id && (
                              <Check className="w-4 h-4 text-primary-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content Type */}
                <div>
                  <button
                    onClick={() => toggleSection("content")}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Content Type
                    </Label>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSection === "content" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSection === "content" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {CONTENT_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => toggleContentType(type.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              filters.contentType.includes(type.id)
                                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <type.icon className="w-4 h-4 text-primary-600" />
                            <span className="text-sm flex-1 text-left">{type.label}</span>
                            {filters.contentType.includes(type.id) && (
                              <Check className="w-4 h-4 text-primary-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Verification Status */}
                <div>
                  <button
                    onClick={() => toggleSection("verified")}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Author Status
                    </Label>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSection === "verified" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSection === "verified" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {[
                          { id: "all", label: "All authors" },
                          { id: "verified", label: "Verified scholars only" },
                          { id: "unverified", label: "Community members" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              updateFilter("verified", option.id as SearchFilterState["verified"])
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              filters.verified === option.id
                                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <span className="text-sm">{option.label}</span>
                            {filters.verified === option.id && (
                              <Check className="w-4 h-4 text-primary-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tags */}
                <div>
                  <button
                    onClick={() => toggleSection("tags")}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <Label className="text-sm font-semibold">Popular Tags</Label>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSection === "tags" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSection === "tags" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-wrap gap-2 overflow-hidden"
                      >
                        {POPULAR_TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              filters.tags.includes(tag)
                                ? "bg-primary-600 text-white"
                                : "bg-muted text-foreground hover:bg-muted-foreground/20"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-card border-t border-border p-6 space-y-3">
                {hasActiveFilters && (
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="w-full"
                  >
                    Clear all filters
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  Show results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
