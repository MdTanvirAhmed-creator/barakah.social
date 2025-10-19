"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Mock posts for demonstration
const MOCK_POSTS = [
  {
    id: "1",
    content:
      'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ\n\nThe Prophet ﷺ said: "The best of you are those who learn the Quran and teach it." (Bukhari)\n\nReflection: This hadith emphasizes the importance of both learning and teaching. Knowledge of the Quran is not just for personal benefit but should be shared with others. May Allah grant us beneficial knowledge.',
    author: {
      id: "author1",
      username: "sheikh_ahmad",
      full_name: "Sheikh Ahmad Al-Maliki",
      avatar_url: "",
      is_verified_scholar: true,
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    beneficial_count: 127,
    comment_count: 23,
    tags: ["Hadith", "Quran", "Knowledge"],
    has_user_marked_beneficial: false,
    has_user_bookmarked: false,
  },
  {
    id: "2",
    content:
      "Assalamu alaikum brothers and sisters. Can someone explain the ruling on combining prayers while traveling? What are the conditions according to different madhabs?",
    author: {
      id: "author2",
      username: "fatima_student",
      full_name: "Fatima Rahman",
      avatar_url: "",
      is_verified_scholar: false,
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    beneficial_count: 34,
    comment_count: 12,
    tags: ["Fiqh", "Salah", "Question"],
    has_user_marked_beneficial: true,
    has_user_bookmarked: false,
  },
  {
    id: "3",
    content:
      "Just finished reading about the Battle of Badr. SubhanAllah, the lessons from that event are so relevant today - reliance on Allah, unity, and courage in the face of overwhelming odds. Highly recommend studying the seerah!",
    author: {
      id: "author3",
      username: "abdullah_dev",
      full_name: "Abdullah Ahmed",
      avatar_url: "",
      is_verified_scholar: false,
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    beneficial_count: 89,
    comment_count: 31,
    tags: ["Seerah", "Islamic History", "Inspiration"],
    has_user_marked_beneficial: false,
    has_user_bookmarked: true,
  },
];

// Loading skeleton component
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

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-3">
        Your feed is ready!
      </h3>
      <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
        Start by joining Halaqas, following scholars, or sharing your first
        post to see content here.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          asChild
          className="bg-primary-600 hover:bg-primary-700"
        >
          <a href="/halaqas">Explore Halaqas</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/knowledge">Browse Knowledge</a>
        </Button>
      </div>
    </motion.div>
  );
}

// Question of the week card
function QuestionOfTheWeek() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg shadow-lg p-6 mb-6 text-white w-full"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💡</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Question of the Week</h3>
          <p className="text-secondary-50 mb-4">
            How can we maintain sincerity (ikhlas) in our acts of worship in
            the age of social media?
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            Share Your Thoughts
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface FeedListProps {
  feedType?: "for-you" | "halaqas" | "verified" | "companions";
  onRefresh?: () => void;
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
  has_user_marked_beneficial: boolean;
  has_user_bookmarked: boolean;
}

export function FeedList({ feedType = "for-you", onRefresh }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  // Load posts from database
  useEffect(() => {
    loadPosts();
  }, [feedType]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_verified_scholar
          ),
          comments(count)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error loading posts:", error);
        // Fallback to mock data if database fails
        setPosts(MOCK_POSTS);
        return;
      }

      // Transform the data to match our interface
      const transformedPosts = postsData?.map((post: any) => ({
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
        beneficial_count: post.beneficial_count || 0,
        comment_count: post.comments?.[0]?.count || 0,
        tags: post.tags || [],
        has_user_marked_beneficial: false, // TODO: Check if current user marked beneficial
        has_user_bookmarked: false, // TODO: Check if current user bookmarked
      })) || [];

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error:", error);
      // Fallback to mock data
      setPosts(MOCK_POSTS);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    if (onRefresh) {
      onRefresh();
    }
    setIsRefreshing(false);
  };

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
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Pull to refresh
            </>
          )}
        </Button>
      </div>

      {/* Question of the Week */}
      {feedType === "for-you" && <QuestionOfTheWeek />}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <EmptyState />
      ) : (
        /* Posts */
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {/* Load More */}
          <div className="text-center py-8">
            <Button variant="outline" className="px-8">
              Load More Posts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

