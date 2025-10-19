"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Hash,
  Users,
  FileText,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchSuggestion {
  id: string;
  type: "user" | "halaqa" | "tag" | "post";
  text: string;
  subtitle?: string;
  icon: React.ElementType;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: Date;
}

const TRENDING_SEARCHES = [
  "Ramadan preparation",
  "Tafsir Al-Kahf",
  "Halal investing",
  "Convert resources",
  "Fiqh of fasting",
];

const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: "1",
    type: "user",
    text: "Sheikh Ahmad Al-Maliki",
    subtitle: "Verified Scholar",
    icon: Users,
  },
  {
    id: "2",
    type: "halaqa",
    text: "Quran Study Circle",
    subtitle: "234 members",
    icon: Users,
  },
  {
    id: "3",
    type: "tag",
    text: "#Ramadan",
    subtitle: "1.2k posts",
    icon: Hash,
  },
  {
    id: "4",
    type: "post",
    text: "Understanding the pillars of Islam",
    subtitle: "by Dr. Fatima Rahman",
    icon: FileText,
  },
];

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query for better performance
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      setIsLoading(true);
      // Simulate API call (replace with actual Supabase query)
      const fetchSuggestions = async () => {
        try {
          // In production, this would be:
          // const results = await supabase
          //   .from('posts')
          //   .select('*')
          //   .textSearch('content', debouncedQuery)
          //   .limit(5);
          
          const filtered = MOCK_SUGGESTIONS.filter((s) =>
            s.text.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
          setSuggestions(filtered);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSuggestions();
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: new Date(),
    };
    const updated = [newSearch, ...recentSearches.slice(0, 4)];
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const removeRecentSearch = (id: string) => {
    const updated = recentSearches.filter((s) => s.id !== id);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div
        className={`relative transition-all duration-200 ${
          isFocused ? "scale-105" : ""
        }`}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search posts, people, halaqas, knowledge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-11 bg-background border-border focus-visible:ring-primary-500 focus-visible:border-primary-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[500px] overflow-y-auto"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            )}

            {/* Search Suggestions */}
            {!isLoading && query && suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  Suggestions
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSearch(suggestion.text)}
                    className="w-full px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3 text-left"
                  >
                    <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <suggestion.icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && query && suggestions.length === 0 && (
              <div className="py-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No suggestions found for &quot;{query}&quot;
                </p>
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((search) => (
                  <div
                    key={search.id}
                    className="px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3 group"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <button
                      onClick={() => handleSearch(search.query)}
                      className="flex-1 text-left text-sm text-foreground truncate"
                    >
                      {search.query}
                    </button>
                    <button
                      onClick={() => removeRecentSearch(search.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/10 rounded transition-all"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {!query && (
              <div className="py-2 border-t border-border">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending Searches
                </div>
                {TRENDING_SEARCHES.map((trending, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(trending)}
                    className="w-full px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3 text-left"
                  >
                    <Hash className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">{trending}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Filters */}
            <div className="py-3 px-3 border-t border-border bg-muted/50">
              <div className="text-xs text-muted-foreground mb-2">Quick filters:</div>
              <div className="flex flex-wrap gap-2">
                {["Posts", "People", "Halaqas", "Knowledge"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => router.push(`/search?filter=${filter.toLowerCase()}`)}
                    className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-muted transition-colors"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Hint */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Enter</kbd> to search • <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Esc</kbd> to close
        </div>
      )}
    </div>
  );
}
