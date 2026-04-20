"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  X,
  Filter,
  MessageCircle,
  FileText,
  Video,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";

interface BookmarkedPost {
  bookmarkId: string;
  post: {
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
  };
}

type BookmarkType = "all" | "post" | "article" | "video" | "book";

export function BookmarksList() {
  const { success, error: showError } = useToast();
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [filterType, setFilterType] = useState<BookmarkType>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBookmarks() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("bookmarks")
        .select(
          `id, post_id, created_at,
           posts!bookmarks_post_id_fkey(
             id, content, tags, media_urls, beneficial_count, created_at, is_deleted,
             profiles!posts_author_id_fkey(id, username, full_name, avatar_url, is_verified_scholar),
             comments!comments_post_id_fkey(count)
           )`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Error loading bookmarks:", error);
        return;
      }

      // Filter out deleted posts
      const active = (data as any[]).filter((b: any) => b.posts && !b.posts.is_deleted);

      // Check which posts user has marked beneficial
      const postIds = active.map((b: any) => b.posts.id);
      const markedIds = new Set<string>();
      if (postIds.length) {
        const { data: marks } = await (supabase as any)
          .from("beneficial_marks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds);
        (marks as { post_id: string }[] | null)?.forEach((m) => markedIds.add(m.post_id));
      }

      const transformed: BookmarkedPost[] = active.map((b: any) => ({
        bookmarkId: b.id,
        post: {
          id: b.posts.id,
          content: b.posts.content,
          author: {
            id: b.posts.profiles.id,
            username: b.posts.profiles.username,
            full_name: b.posts.profiles.full_name,
            avatar_url: b.posts.profiles.avatar_url,
            is_verified_scholar: b.posts.profiles.is_verified_scholar,
          },
          created_at: b.posts.created_at,
          beneficial_count: b.posts.beneficial_count ?? 0,
          comment_count: b.posts.comments?.[0]?.count ?? 0,
          tags: b.posts.tags ?? [],
          media_urls: b.posts.media_urls ?? [],
          has_user_marked_beneficial: markedIds.has(b.posts.id),
          has_user_bookmarked: true,
        },
      }));

      setBookmarks(transformed);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveBookmark(bookmarkId: string, postId: string) {
    // Optimistic remove
    setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) {
      console.error("Error removing bookmark:", error);
      showError("Failed to remove bookmark");
      loadBookmarks(); // Reload to restore state
    } else {
      success("Bookmark removed");
    }
  }

  const typeFilters = [
    { id: "all" as const, label: "All", icon: Bookmark, count: bookmarks.length },
    { id: "post" as const, label: "Posts", icon: MessageCircle, count: bookmarks.length },
    { id: "article" as const, label: "Articles", icon: FileText, count: 0 },
    { id: "video" as const, label: "Videos", icon: Video, count: 0 },
    { id: "book" as const, label: "Books", icon: BookOpen, count: 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-foreground">Filter Bookmarks</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === filter.id
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
              <span className="text-xs opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Bookmarks Yet</h3>
          <p className="text-muted-foreground mb-6">Save posts to read later</p>
          <div className="max-w-md mx-auto bg-card rounded-lg border border-border p-4">
            <h4 className="font-semibold text-foreground mb-2">How to Bookmark</h4>
            <ul className="text-sm text-foreground-secondary space-y-1 text-left">
              <li>• Look for the bookmark icon on any post</li>
              <li>• Click to save for later</li>
              <li>• Access all your bookmarks here</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.bookmarkId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <PostCard post={bookmark.post} />
              <button
                onClick={() => handleRemoveBookmark(bookmark.bookmarkId, bookmark.post.id)}
                className="absolute top-4 right-4 p-2 bg-card hover:bg-destructive/10 border border-border rounded-lg transition-colors group"
                title="Remove bookmark"
              >
                <X className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
