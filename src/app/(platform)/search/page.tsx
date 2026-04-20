"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Users,
  BookOpen,
  Loader2,
  Sparkles,
  Library,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { HalaqaCard } from "@/components/halaqas/HalaqaCard";
import {
  SearchFilters,
  SearchFilterState,
} from "@/components/search/SearchFilters";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type TabType = "all" | "posts" | "people" | "halaqas" | "knowledge";

interface PostResult {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    is_verified_scholar: boolean;
  };
  created_at: string;
  beneficial_count: number;
  comment_count: number;
  tags: string[];
  media_urls: string[];
  has_user_marked_beneficial: boolean;
  has_user_bookmarked: boolean;
}

interface UserResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified_scholar: boolean;
  beneficial_count: number;
}

interface HalaqaResult {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_public: boolean;
  avatar_url?: string | null;
  rules: string[];
  created_at: string;
  updated_at: string;
  members: Array<{ id: string; name: string; avatar: string | null }>;
  is_member: boolean;
  role: "admin" | "moderator" | "member" | null;
}

interface SearchResults {
  posts: PostResult[];
  users: UserResult[];
  halaqas: HalaqaResult[];
}

const EMPTY: SearchResults = { posts: [], users: [], halaqas: [] };

function dateRangeCutoff(range: SearchFilterState["dateRange"]): string | null {
  const now = Date.now();
  const map: Record<string, number> = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  return map[range] ? new Date(now - map[range]).toISOString() : null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || "";
  const filterParam = searchParams?.get("filter") || "";

  const { user } = useSupabaseAuth();
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>({
    dateRange: "all",
    contentType: [],
    verified: "all",
    tags: [],
    sortBy: "relevance",
  });
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (filterParam) setActiveTab(filterParam as TabType);
  }, [filterParam]);

  useEffect(() => {
    if (!queryParam) {
      setResults(EMPTY);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(queryParam, filters), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryParam, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  async function performSearch(q: string, f: SearchFilterState) {
    setIsLoading(true);
    try {
      const [posts, users, halaqas] = await Promise.all([
        searchPosts(q, f),
        searchUsers(q, f),
        searchHalaqas(q, f),
      ]);
      setResults({ posts, users, halaqas });
    } catch (err) {
      console.error("Search error:", err);
      setResults(EMPTY);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchPosts(q: string, f: SearchFilterState): Promise<PostResult[]> {
    const cutoff = dateRangeCutoff(f.dateRange);
    const orderCol = f.sortBy === "popular" ? "beneficial_count" : "created_at";

    // If verified-only filter, resolve author IDs first
    let verifiedIds: string[] | null = null;
    if (f.verified === "verified") {
      const { data: vp } = await sb
        .from("profiles")
        .select("id")
        .eq("is_verified_scholar", true);
      verifiedIds = (vp as { id: string }[] | null)?.map((p) => p.id) ?? [];
      if (!verifiedIds.length) return [];
    }

    let query = sb
      .from("posts")
      .select(
        `id, content, tags, media_urls, beneficial_count, created_at, author_id,
         profiles!posts_author_id_fkey(id, username, full_name, avatar_url, is_verified_scholar),
         comments!comments_post_id_fkey(count)`
      )
      .ilike("content", `%${q}%`)
      .eq("is_deleted", false)
      .order(orderCol, { ascending: false })
      .limit(20);

    if (cutoff) query = query.gte("created_at", cutoff);
    if (verifiedIds) query = query.in("author_id", verifiedIds);

    const { data, error } = await query;
    if (error || !data) return [];

    // Check user's beneficial marks and bookmarks
    const postIds = (data as { id: string }[]).map((p) => p.id);
    const markedIds = new Set<string>();
    const bookmarkedIds = new Set<string>();

    if (user && postIds.length) {
      const [{ data: marks }, { data: bookmarks }] = await Promise.all([
        (supabase as any).from("beneficial_marks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        (supabase as any).from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ]);
      (marks as { post_id: string }[] | null)?.forEach((m) => markedIds.add(m.post_id));
      (bookmarks as { post_id: string }[] | null)?.forEach((b) => bookmarkedIds.add(b.post_id));
    }

    return (data as any[]).map((post) => ({
      id: post.id,
      content: post.content,
      author: {
        id: post.profiles.id,
        username: post.profiles.username,
        full_name: post.profiles.full_name,
        avatar_url: post.profiles.avatar_url,
        is_verified_scholar: post.profiles.is_verified_scholar,
      },
      created_at: post.created_at,
      beneficial_count: post.beneficial_count ?? 0,
      comment_count: post.comments?.[0]?.count ?? 0,
      tags: post.tags ?? [],
      media_urls: post.media_urls ?? [],
      has_user_marked_beneficial: markedIds.has(post.id),
      has_user_bookmarked: bookmarkedIds.has(post.id),
    }));
  }

  async function searchUsers(q: string, f: SearchFilterState): Promise<UserResult[]> {
    let query = sb
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, is_verified_scholar, beneficial_count")
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .order("beneficial_count", { ascending: false })
      .limit(20);

    if (f.verified === "verified") query = query.eq("is_verified_scholar", true);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as UserResult[]);
  }

  async function searchHalaqas(q: string, f: SearchFilterState): Promise<HalaqaResult[]> {
    const cutoff = dateRangeCutoff(f.dateRange);

    let query = sb
      .from("halaqas")
      .select("id, name, description, category, member_count, is_public, avatar_url, rules, created_at, updated_at")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .eq("is_active", true)
      .eq("is_public", true)
      .order("member_count", { ascending: false })
      .limit(20);

    if (cutoff) query = query.gte("created_at", cutoff);

    const { data, error } = await query;
    if (error || !data) return [];

    const halaqaIds = (data as { id: string }[]).map((h) => h.id);

    // Batch-load member previews
    const memberPreviews: Record<string, Array<{ id: string; name: string; avatar: string | null }>> = {};
    const roleMap: Record<string, "admin" | "moderator" | "member"> = {};

    if (halaqaIds.length) {
      const [{ data: members }, { data: memberships }] = await Promise.all([
        sb
          .from("halaqa_members")
          .select("halaqa_id, user_id, profiles!halaqa_members_user_id_fkey(id, full_name, avatar_url)")
          .in("halaqa_id", halaqaIds)
          .limit(halaqaIds.length * 3),
        user
          ? (supabase as any).from("halaqa_members").select("halaqa_id, role").eq("user_id", user.id).in("halaqa_id", halaqaIds)
          : Promise.resolve({ data: [] }),
      ]);

      (members as any[] | null ?? []).forEach((row: any) => {
        const hid = row.halaqa_id;
        if (!memberPreviews[hid]) memberPreviews[hid] = [];
        if (memberPreviews[hid].length < 3 && row.profiles) {
          memberPreviews[hid].push({
            id: row.profiles.id,
            name: row.profiles.full_name ?? "Member",
            avatar: row.profiles.avatar_url,
          });
        }
      });

      (memberships as { halaqa_id: string; role: string }[] | null ?? []).forEach((m) => {
        roleMap[m.halaqa_id] = m.role as "admin" | "moderator" | "member";
      });
    }

    return (data as any[]).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description ?? "",
      category: h.category ?? "General",
      member_count: h.member_count ?? 0,
      is_public: h.is_public,
      avatar_url: h.avatar_url,
      rules: h.rules ? h.rules.split("\n").filter((r: string) => r.trim()) : [],
      created_at: h.created_at,
      updated_at: h.updated_at,
      members: memberPreviews[h.id] ?? [],
      is_member: !!roleMap[h.id],
      role: roleMap[h.id] ?? null,
    }));
  }

  const tabs = [
    { id: "all" as const, label: "All", icon: Search },
    { id: "posts" as const, label: "Posts", icon: FileText },
    { id: "people" as const, label: "People", icon: Users },
    { id: "halaqas" as const, label: "Halaqas", icon: Users },
    { id: "knowledge" as const, label: "Knowledge", icon: BookOpen },
  ];

  const getTotalResults = () => results.posts.length + results.users.length + results.halaqas.length;

  if (!queryParam) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Search className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Search Barakah.Social</h2>
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

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-6">
            {/* ── All ── */}
            {activeTab === "all" && (
              <div className="space-y-8">
                {results.posts.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Posts
                    </h2>
                    <div className="space-y-4 max-w-3xl">
                      {results.posts.slice(0, 3).map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                    {results.posts.length > 3 && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setActiveTab("posts")}>
                        View all {results.posts.length} posts
                      </Button>
                    )}
                  </section>
                )}

                {results.users.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      People
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.users.slice(0, 4).map((u) => (
                        <UserCard key={u.id} user={u} />
                      ))}
                    </div>
                    {results.users.length > 4 && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setActiveTab("people")}>
                        View all {results.users.length} people
                      </Button>
                    )}
                  </section>
                )}

                {results.halaqas.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Halaqas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.halaqas.slice(0, 3).map((h) => (
                        <HalaqaCard key={h.id} halaqa={h} viewMode="grid" />
                      ))}
                    </div>
                    {results.halaqas.length > 3 && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setActiveTab("halaqas")}>
                        View all {results.halaqas.length} halaqas
                      </Button>
                    )}
                  </section>
                )}

                {getTotalResults() === 0 && <EmptyState />}
              </div>
            )}

            {/* ── Posts ── */}
            {activeTab === "posts" && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {results.posts.length === 0 ? (
                  <EmptyState label="posts" />
                ) : (
                  results.posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            )}

            {/* ── People ── */}
            {activeTab === "people" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {results.users.length === 0 ? (
                  <div className="col-span-2"><EmptyState label="people" /></div>
                ) : (
                  results.users.map((u) => <UserCard key={u.id} user={u} large />)
                )}
              </div>
            )}

            {/* ── Halaqas ── */}
            {activeTab === "halaqas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.halaqas.length === 0 ? (
                  <div className="col-span-3"><EmptyState label="halaqas" /></div>
                ) : (
                  results.halaqas.map((h) => <HalaqaCard key={h.id} halaqa={h} viewMode="grid" />)
                )}
              </div>
            )}

            {/* ── Knowledge ── */}
            {activeTab === "knowledge" && (
              <div className="text-center py-16 px-4 bg-card rounded-lg border border-border">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Library className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Content library is being built</h3>
                <p className="text-foreground-secondary max-w-md mx-auto">
                  Knowledge search will be available once our content library is populated. Browse Learning Paths in the meantime.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ user, large = false }: { user: UserResult; large?: boolean }) {
  if (large) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{user.full_name}</h3>
            {user.is_verified_scholar && <Sparkles className="w-4 h-4 text-primary-500" />}
          </div>
          <p className="text-sm text-muted-foreground mb-3">@{user.username}</p>
          {user.bio && <p className="text-sm text-foreground-secondary mb-4 line-clamp-3">{user.bio}</p>}
          <p className="text-xs text-muted-foreground mb-4">{user.beneficial_count} beneficial marks</p>
          <Button className="w-full" size="sm">Follow</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{user.full_name}</h3>
            {user.is_verified_scholar && <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">{user.bio}</p>}
        </div>
        <Button size="sm">Follow</Button>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="text-center py-12">
      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No {label ?? "results"} found
      </h3>
      <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
      <div className="max-w-md mx-auto bg-card rounded-lg border border-border p-4">
        <h4 className="font-semibold text-foreground mb-2">Suggestions:</h4>
        <ul className="text-sm text-foreground-secondary space-y-1 text-left">
          <li>• Check your spelling</li>
          <li>• Try more general keywords</li>
          <li>• Remove some filters</li>
          <li>• Search for related terms</li>
        </ul>
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
