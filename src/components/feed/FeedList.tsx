"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 20;

function PostSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-6 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-12 h-12 bg-muted rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  );
}

const EMPTY_STATE_COPY: Record<string, { title: string; body: string; href?: string; cta?: string }> = {
  "for-you": {
    title: "Your feed is ready!",
    body: "Start by joining Halaqas, following scholars, or sharing your first post to see content here.",
    href: "/halaqas",
    cta: "Explore Halaqas",
  },
  "halaqas": {
    title: "No Halaqa posts yet",
    body: "Join study circles to see posts from fellow members here.",
    href: "/halaqas",
    cta: "Browse Halaqas",
  },
  "verified": {
    title: "No verified scholar posts yet",
    body: "Verified scholars haven't posted yet — check back soon.",
  },
  "companions": {
    title: "No companion posts yet",
    body: "Connect with companions to see their posts here.",
    href: "/tools/companions",
    cta: "Find Companions",
  },
};

function EmptyState({ feedType }: { feedType: string }) {
  const msg = EMPTY_STATE_COPY[feedType] ?? EMPTY_STATE_COPY["for-you"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-3">{msg.title}</h3>
      <p className="text-foreground-secondary mb-6 max-w-md mx-auto">{msg.body}</p>
      {msg.href && msg.cta && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <a href={msg.href}>{msg.cta}</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/knowledge">Browse Knowledge</a>
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function QuestionOfTheWeek() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card border border-border rounded-lg p-6 mb-6 w-full overflow-hidden"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-1 inline-block w-2.5 h-2.5 rotate-45 bg-[var(--accent-rare)] flex-shrink-0"
        />
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium mb-2 text-foreground">
            Question of the week
          </h3>
          <p className="text-foreground-secondary mb-4">
            How can we maintain sincerity (ikhlas) in our acts of worship in the age of social media?
          </p>
          <Button variant="quiet" size="sm">
            Share your thoughts
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface Post {
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

interface FeedListProps {
  feedType?: "for-you" | "halaqas" | "verified" | "companions";
  onRefresh?: () => void;
}

export function FeedList({ feedType = "for-you", onRefresh }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const supabase = createClient();

  async function resolveAuthorIds(userId: string | undefined): Promise<string[] | null> {
    if (feedType === "verified") {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("is_verified_scholar", true);
      return (data as { id: string }[] | null)?.map((p) => p.id) ?? [];
    }

    if (feedType === "halaqas" && userId) {
      const { data: memberships } = await (supabase as any)
        .from("halaqa_members")
        .select("halaqa_id")
        .eq("user_id", userId);

      if (!memberships?.length) return [];

      const halaqaIds = (memberships as { halaqa_id: string }[]).map((m) => m.halaqa_id);
      const { data: members } = await (supabase as any)
        .from("halaqa_members")
        .select("user_id")
        .in("halaqa_id", halaqaIds)
        .neq("user_id", userId);

      return (members as { user_id: string }[] | null)?.map((m) => m.user_id) ?? [];
    }

    if (feedType === "companions" && userId) {
      const { data: connections } = await (supabase as any)
        .from("companion_connections")
        .select("requester_id, recipient_id")
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq("status", "accepted");

      return (
        (connections as { requester_id: string; recipient_id: string }[] | null)?.map((c) =>
          c.requester_id === userId ? c.recipient_id : c.requester_id
        ) ?? []
      );
    }

    return null; // null = no filter (for-you)
  }

  async function fetchPage(currentOffset: number): Promise<{ posts: Post[]; hasMore: boolean }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const authorIds = await resolveAuthorIds(user?.id);

    // Empty filter set — no need to query
    if (authorIds !== null && authorIds.length === 0) {
      return { posts: [], hasMore: false };
    }

    let query = (supabase as any)
      .from("posts")
      .select(
        `
          id, content, post_type, media_urls, tags, beneficial_count, created_at, author_id,
          profiles!posts_author_id_fkey (id, username, full_name, avatar_url, is_verified_scholar),
          comments!comments_post_id_fkey(count)
        `
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (authorIds !== null) {
      query = query.in("author_id", authorIds);
    }

    const { data: postsData, error } = await query;

    if (error || !postsData) {
      console.error("Error loading posts:", error);
      return { posts: [], hasMore: false };
    }

    // Fetch this user's beneficial marks and bookmarks in parallel
    const postIds = (postsData as { id: string }[]).map((p) => p.id);
    const markedIds = new Set<string>();
    const bookmarkedIds = new Set<string>();

    if (user && postIds.length > 0) {
      const [{ data: marks }, { data: bookmarks }] = await Promise.all([
        (supabase as any)
          .from("beneficial_marks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds),
        (supabase as any)
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds),
      ]);
      (marks as { post_id: string }[] | null)?.forEach((m) => markedIds.add(m.post_id));
      (bookmarks as { post_id: string }[] | null)?.forEach((b) => bookmarkedIds.add(b.post_id));
    }

    const transformed: Post[] = postsData.map((post: any) => ({
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

    return { posts: transformed, hasMore: transformed.length === PAGE_SIZE };
  }

  async function loadInitial() {
    setIsLoading(true);
    offsetRef.current = 0;
    try {
      const { posts: fresh, hasMore: more } = await fetchPage(0);
      setPosts(fresh);
      setHasMore(more);
      offsetRef.current = PAGE_SIZE;
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    const { posts: next, hasMore: more } = await fetchPage(offsetRef.current);
    setPosts((prev) => [...prev, ...next]);
    setHasMore(more);
    offsetRef.current += PAGE_SIZE;
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadInitial();
    onRefresh?.();
    setIsRefreshing(false);
  }

  useEffect(() => {
    loadInitial();
  }, [feedType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 w-full">
      {/* Refresh Button (Mobile) */}
      <div className="md:hidden">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Pull to refresh"}
        </Button>
      </div>

      {/* Question of the Week */}
      {feedType === "for-you" && <QuestionOfTheWeek />}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState feedType={feedType} />
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {hasMore && (
            <div className="text-center py-8">
              <Button variant="outline" className="px-8" onClick={loadMore}>
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
