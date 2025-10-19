"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Check,
  Users,
  BookOpen,
  Sprout,
  Leaf,
  TreeDeciduous,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { useToast } from "@/hooks/useToast";
import { CommentSection } from "@/components/comments/CommentSection";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      full_name: string;
      avatar_url?: string;
      is_verified_scholar?: boolean;
    };
    created_at: string;
    beneficial_count: number;
    comment_count?: number;
    tags?: string[];
    media_urls?: string[];
    has_user_marked_beneficial?: boolean;
    has_user_bookmarked?: boolean;
    // Companion-related fields
    is_from_companion?: boolean;
    companion_connection_strength?: number; // 0-100
    is_knowledge_post?: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { success } = useToast();
  const [isMarkedBeneficial, setIsMarkedBeneficial] = useState(
    post.has_user_marked_beneficial || false
  );
  const [beneficialCount, setBeneficialCount] = useState(
    post.beneficial_count || 0
  );
  const [isBookmarked, setIsBookmarked] = useState(
    post.has_user_bookmarked || false
  );
  const [showFullContent, setShowFullContent] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBeneficial = async () => {
    // Optimistic update
    setIsMarkedBeneficial(!isMarkedBeneficial);
    setBeneficialCount((prev) => (isMarkedBeneficial ? prev - 1 : prev + 1));

    try {
      // In production, save to database
      // await supabase.from('beneficial_marks').insert/delete
      
      success(
        isMarkedBeneficial
          ? "Removed from beneficial"
          : "Marked as beneficial"
      );
    } catch (err) {
      // Revert on error
      setIsMarkedBeneficial(isMarkedBeneficial);
      setBeneficialCount((prev) => (isMarkedBeneficial ? prev + 1 : prev - 1));
    }
  };

  const handleBookmark = async () => {
    // Optimistic update
    setIsBookmarked(!isBookmarked);

    try {
      // In production, save to database
      success(isBookmarked ? "Removed bookmark" : "Bookmarked");
    } catch (err) {
      // Revert on error
      setIsBookmarked(isBookmarked);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Post by ${post.author.full_name}`,
          text: post.content.slice(0, 100),
          url: `/post/${post.id}`,
        })
        .catch(() => {});
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`
      );
      success("Link copied to clipboard");
    }
  };

  // Truncate long content
  const shouldTruncate = post.content.length > 400;
  const displayContent =
    shouldTruncate && !showFullContent
      ? post.content.slice(0, 400) + "..."
      : post.content;

  // Helper to get connection strength icon and color
  const getConnectionStrength = (strength?: number) => {
    if (!strength) return null;
    if (strength >= 70) return { icon: TreeDeciduous, label: "Strong Bond", color: "text-success" };
    if (strength >= 40) return { icon: Leaf, label: "Growing", color: "text-warning" };
    return { icon: Sprout, label: "New Connection", color: "text-primary-600" };
  };

  const strengthInfo = getConnectionStrength(post.companion_connection_strength);

  return (
    <article className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary-600 transition-all">
                <AvatarImage src={post.author.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  {getInitials(post.author.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-foreground hover:text-primary-600 transition-colors"
                >
                  {post.author.full_name}
                </Link>
                {post.author.is_verified_scholar && (
                  <div
                    className="w-5 h-5 bg-secondary-500 rounded-full flex items-center justify-center"
                    title="Verified Scholar"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {post.is_from_companion && strengthInfo && (
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 ${strengthInfo.color}`}
                    title={strengthInfo.label}
                  >
                    <strengthInfo.icon className="w-3 h-3" />
                    <span className="text-xs font-medium">Companion</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <time>{formatRelativeTime(post.created_at)}</time>
              </div>
            </div>
          </div>

          {/* More Options */}
          <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
            >
              {showFullContent ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Media Gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4">
            {post.media_urls.length === 1 ? (
              <div className="relative w-full h-96">
                <Image
                  src={post.media_urls[0]}
                  alt="Post media"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative h-48">
                    <Image
                      src={url}
                      alt={`Post media ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {index === 3 && post.media_urls!.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                        +{post.media_urls!.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pt-3 border-t border-border">
          {/* Beneficial (Like) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBeneficial}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isMarkedBeneficial
                ? "text-success bg-success-50 dark:bg-success-900/20"
                : "text-muted-foreground hover:bg-muted hover:text-success"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isMarkedBeneficial ? "fill-success" : ""
              }`}
            />
            <span className="text-sm font-medium">
              {beneficialCount > 0 && beneficialCount}
            </span>
            <span className="hidden sm:inline text-sm">
              {isMarkedBeneficial ? "Beneficial" : "نافع"}
            </span>
          </motion.button>

          {/* Comment */}
          <Link href={`/post/${post.id}`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-primary-600"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {post.comment_count && post.comment_count > 0
                  ? post.comment_count
                  : ""}
              </span>
              <span className="hidden sm:inline text-sm">Comment</span>
            </motion.button>
          </Link>

          {/* Share */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Share</span>
          </motion.button>

          {/* Study Together (for knowledge posts from companions) */}
          {post.is_knowledge_post && post.is_from_companion && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => success("Study partnership feature coming soon!")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/30"
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Study Together</span>
            </motion.button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bookmark */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBookmark}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? "text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20"
                : "text-muted-foreground hover:bg-muted hover:text-secondary-600"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 fill-secondary-600" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection postId={post.id} commentCount={post.comment_count || 0} />
    </article>
  );
}

