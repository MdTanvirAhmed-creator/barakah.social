"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Users,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { HalaqaCard } from "@/components/halaqas/HalaqaCard";
import { ContentCard } from "@/components/knowledge/ContentCard";
import {
  SearchFilters,
  SearchFilterState,
} from "@/components/search/SearchFilters";

type TabType = "all" | "posts" | "people" | "halaqas" | "knowledge";

interface SearchResult {
  type: "post" | "user" | "halaqa" | "article";
  data: any;
}

// Mock search results
const MOCK_RESULTS = {
  posts: [
    {
      id: "1",
      author: {
        id: "user1",
        username: "sheikh_ahmad",
        full_name: "Sheikh Ahmad Al-Maliki",
        avatar_url: undefined,
        is_verified_scholar: true,
      },
      content:
        "The Prophet (ﷺ) said: 'The best of people are those that bring most benefit to the rest of mankind.' This hadith reminds us that our value isn't in what we accumulate, but in what we contribute.",
      tags: ["Hadith", "Wisdom", "Beneficial"],
      beneficial_count: 234,
      comment_count: 45,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_beneficial: false,
      is_bookmarked: false,
    },
  ],
  users: [
    {
      id: "user1",
      username: "sheikh_ahmad",
      full_name: "Sheikh Ahmad Al-Maliki",
      avatar_url: undefined,
      bio: "Islamic scholar specializing in Fiqh and Hadith studies. Teaching for 20+ years.",
      is_verified_scholar: true,
      followers: 12500,
    },
    {
      id: "user2",
      username: "dr_fatima",
      full_name: "Dr. Fatima Rahman",
      avatar_url: undefined,
      bio: "PhD in Islamic Studies. Passionate about Quranic tafsir and women's issues in Islam.",
      is_verified_scholar: true,
      followers: 8300,
    },
  ],
  halaqas: [
    {
      id: "1",
      name: "Quran Tafsir Circle",
      description:
        "Weekly study of Quranic interpretation with Sheikh Ahmad. Open to all levels.",
      category: "Quran Studies",
      member_count: 234,
      max_members: 500,
      is_public: true,
      cover_image: null,
      rules: ["Be respectful", "Come prepared"],
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      is_member: false,
      role: undefined,
    },
  ],
  knowledge: [
    {
      id: "1",
      type: "article" as const,
      title: "Understanding the Five Pillars of Islam",
      author: "Dr. Fatima Rahman",
      authorAvatar: null,
      thumbnail: null,
      duration: "12 min read",
      difficulty: "beginner" as const,
      rating: 4.8,
      views: 12500,
      category: "Basics",
      tags: ["Fundamentals", "Beginner"],
      published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "A comprehensive guide to the fundamental pillars of Islamic practice.",
      is_saved: false,
    },
  ],
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";
  const filterParam = searchParams?.get("filter") || "";

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>({
    dateRange: "all",
    contentType: [],
    verified: "all",
    tags: [],
    sortBy: "relevance",
  });
  const [results, setResults] = useState(MOCK_RESULTS);

  // Set initial tab based on filter param
  useEffect(() => {
    if (filterParam) {
      setActiveTab(filterParam as TabType);
    }
  }, [filterParam]);

  // Simulate search when query or filters change
  useEffect(() => {
    if (queryParam) {
      setIsLoading(true);
      setTimeout(() => {
        setResults(MOCK_RESULTS);
        setIsLoading(false);
      }, 800);
    }
  }, [queryParam, filters]);

  const tabs = [
    { id: "all" as const, label: "All", icon: Search },
    { id: "posts" as const, label: "Posts", icon: FileText },
    { id: "people" as const, label: "People", icon: Users },
    { id: "halaqas" as const, label: "Halaqas", icon: Users },
    { id: "knowledge" as const, label: "Knowledge", icon: BookOpen },
  ];

  const getTotalResults = () => {
    return (
      results.posts.length +
      results.users.length +
      results.halaqas.length +
      results.knowledge.length
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!queryParam) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Search className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Search Barakah.Social
          </h2>
          <p className="text-muted-foreground mb-6">
            Find posts, people, halaqas, and knowledge to benefit from
          </p>
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">Popular searches:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Ramadan", "Tafsir", "Hadith", "Fiqh", "Prayer"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container-custom py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Search results for &quot;{queryParam}&quot;
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-muted-foreground">
              {isLoading ? "Searching..." : `${getTotalResults()} results found`}
            </p>
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={getTotalResults()}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="searchTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-6">
            {/* All Results */}
            {activeTab === "all" && (
              <div className="space-y-8">
                {/* Posts Section */}
                {results.posts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Posts
                    </h2>
                    <div className="space-y-4">
                      {results.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}

                {/* People Section */}
                {results.users.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      People
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.users.map((user) => (
                        <div
                          key={user.id}
                          className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">
                                  {user.full_name}
                                </h3>
                                {user.is_verified_scholar && (
                                  <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                @{user.username}
                              </p>
                              <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">
                                {user.bio}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {user.followers.toLocaleString()} followers
                              </p>
                            </div>
                            <Button size="sm">Follow</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Halaqas Section */}
                {results.halaqas.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Halaqas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.halaqas.map((halaqa) => (
                        <HalaqaCard key={halaqa.id} halaqa={halaqa} viewMode="grid" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Knowledge Section */}
                {results.knowledge.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Knowledge
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.knowledge.map((item) => (
                        <ContentCard
                          key={item.id}
                          content={item}
                          isSaved={item.is_saved}
                          onSave={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Posts Only */}
            {activeTab === "posts" && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* People Only */}
            {activeTab === "people" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {user.full_name}
                        </h3>
                        {user.is_verified_scholar && (
                          <Sparkles className="w-4 h-4 text-primary-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        @{user.username}
                      </p>
                      <p className="text-sm text-foreground-secondary mb-4">
                        {user.bio}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {user.followers.toLocaleString()} followers
                      </p>
                      <Button className="w-full">Follow</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Halaqas Only */}
            {activeTab === "halaqas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.halaqas.map((halaqa) => (
                  <HalaqaCard key={halaqa.id} halaqa={halaqa} viewMode="grid" />
                ))}
              </div>
            )}

            {/* Knowledge Only */}
            {activeTab === "knowledge" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.knowledge.map((item) => (
                  <ContentCard
                    key={item.id}
                    content={item}
                    isSaved={item.is_saved}
                    onSave={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {getTotalResults() === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <div className="max-w-md mx-auto">
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      Suggestions:
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1 text-left">
                      <li>• Check your spelling</li>
                      <li>• Try more general keywords</li>
                      <li>• Remove some filters</li>
                      <li>• Search for related terms</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {!isLoading && getTotalResults() > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              Load more results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
