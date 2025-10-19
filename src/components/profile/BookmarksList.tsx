"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  X,
  Filter,
  MessageCircle,
  FileText,
  Video,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { useToast } from "@/hooks/useToast";

const MOCK_BOOKMARKS = [
  {
    id: "1",
    type: "post" as const,
    post: {
      id: "post1",
      author: {
        id: "user2",
        username: "sheikh_ahmad",
        full_name: "Sheikh Ahmad Al-Maliki",
        avatar_url: undefined,
        is_verified_scholar: true,
      },
      content: "The Prophet (ﷺ) said: \"The best of people are those that bring most benefit to the rest of mankind.\" This hadith reminds us that our value isn't in what we accumulate, but in what we contribute.",
      tags: ["Hadith", "Wisdom", "Beneficial"],
      beneficial_count: 234,
      comment_count: 45,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_beneficial: true,
      is_bookmarked: true,
    },
    bookmarked_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "post" as const,
    post: {
      id: "post2",
      author: {
        id: "user3",
        username: "dr_fatima",
        full_name: "Dr. Fatima Rahman",
        avatar_url: undefined,
        is_verified_scholar: true,
      },
      content: "Beautiful reminder about the importance of Tahajjud prayer. The Prophet (ﷺ) never missed it. Let's try to wake up for just 2 rakats this week. Start small, be consistent. May Allah accept from us all. 🤲",
      tags: ["Prayer", "Spirituality", "Ramadan"],
      beneficial_count: 156,
      comment_count: 28,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_beneficial: false,
      is_bookmarked: true,
    },
    bookmarked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type BookmarkType = "all" | "post" | "article" | "video" | "book";

export function BookmarksList() {
  const { success } = useToast();
  const [bookmarks, setBookmarks] = useState(MOCK_BOOKMARKS);
  const [filterType, setFilterType] = useState<BookmarkType>("all");

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (filterType === "all") return true;
    return bookmark.type === filterType;
  });

  const handleRemoveBookmark = (bookmarkId: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    success("Bookmark removed");
  };

  const typeFilters = [
    { id: "all" as const, label: "All", icon: Bookmark, count: bookmarks.length },
    { id: "post" as const, label: "Posts", icon: MessageCircle, count: bookmarks.filter(b => b.type === "post").length },
    { id: "article" as const, label: "Articles", icon: FileText, count: 0 },
    { id: "video" as const, label: "Videos", icon: Video, count: 0 },
    { id: "book" as const, label: "Books", icon: BookOpen, count: 0 },
  ];

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

      {/* Bookmarks Grid */}
      {filteredBookmarks.length > 0 ? (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <PostCard post={bookmark.post} />
              <button
                onClick={() => handleRemoveBookmark(bookmark.id)}
                className="absolute top-4 right-4 p-2 bg-card hover:bg-error/10 border border-border rounded-lg transition-colors group"
                title="Remove bookmark"
              >
                <X className="w-4 h-4 text-muted-foreground group-hover:text-error" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Bookmarks Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Save posts, articles, and videos to read later
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-lg border border-border p-4">
              <h4 className="font-semibold text-foreground mb-2">How to Bookmark</h4>
              <ul className="text-sm text-foreground-secondary space-y-1 text-left">
                <li>• Look for the bookmark icon on any content</li>
                <li>• Click to save for later</li>
                <li>• Access all your bookmarks here</li>
                <li>• Organize by type using filters</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
