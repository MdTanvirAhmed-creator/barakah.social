"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronUp, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";

interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_verified_scholar: boolean;
  };
  content: string;
  beneficial_count: number;
  is_beneficial: boolean;
  created_at: string;
  parent_comment_id: string | null;
  replies?: Comment[];
  reply_count: number;
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  isExpanded?: boolean;
}

// Mock comments data
const MOCK_COMMENTS: Comment[] = [
  {
    id: "1",
    author: {
      id: "user1",
      username: "ahmad_scholar",
      full_name: "Sheikh Ahmad Al-Maliki",
      avatar_url: null,
      is_verified_scholar: true,
    },
    content: "MashaAllah, this is a very beneficial reminder. The Prophet (ﷺ) said: \"The best of people are those that bring most benefit to the rest of mankind.\" (Sahih Al-Jami)",
    beneficial_count: 45,
    is_beneficial: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    parent_comment_id: null,
    reply_count: 2,
    replies: [
      {
        id: "1-1",
        author: {
          id: "user2",
          username: "fatima_h",
          full_name: "Fatima Hassan",
          avatar_url: null,
          is_verified_scholar: false,
        },
        content: "@ahmad_scholar JazakAllah khair for sharing this beautiful hadith!",
        beneficial_count: 12,
        is_beneficial: false,
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        parent_comment_id: "1",
        reply_count: 0,
      },
      {
        id: "1-2",
        author: {
          id: "user3",
          username: "omar_k",
          full_name: "Omar Khan",
          avatar_url: null,
          is_verified_scholar: false,
        },
        content: "SubhanAllah, this is exactly what I needed to hear today. May Allah reward you.",
        beneficial_count: 8,
        is_beneficial: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        parent_comment_id: "1",
        reply_count: 0,
      },
    ],
  },
  {
    id: "2",
    author: {
      id: "user4",
      username: "aisha_m",
      full_name: "Aisha Mohammed",
      avatar_url: null,
      is_verified_scholar: false,
    },
    content: "This reminds me of the ayah: \"And whoever does an atom's weight of good will see it.\" (Quran 99:7). Every small act of kindness matters.",
    beneficial_count: 28,
    is_beneficial: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    parent_comment_id: null,
    reply_count: 1,
    replies: [
      {
        id: "2-1",
        author: {
          id: "user5",
          username: "yusuf_a",
          full_name: "Yusuf Ahmad",
          avatar_url: null,
          is_verified_scholar: false,
        },
        content: "Alhamdulillah, such a powerful reminder!",
        beneficial_count: 5,
        is_beneficial: false,
        created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        parent_comment_id: "2",
        reply_count: 0,
      },
    ],
  },
  {
    id: "3",
    author: {
      id: "user6",
      username: "ibrahim_s",
      full_name: "Ibrahim Siddiqui",
      avatar_url: null,
      is_verified_scholar: false,
    },
    content: "May Allah guide us all to be among those who benefit others. Ameen.",
    beneficial_count: 15,
    is_beneficial: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    parent_comment_id: null,
    reply_count: 0,
  },
];

type SortOption = "newest" | "beneficial";

export function CommentSection({ postId, commentCount, isExpanded = false }: CommentSectionProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showComposer, setShowComposer] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setShowComposer(true);
    }
  };

  const handleAddComment = (content: string, parentId?: string) => {
    const newComment: Comment = {
      id: `${Date.now()}`,
      author: {
        id: "current-user",
        username: "current_user",
        full_name: "Current User",
        avatar_url: null,
        is_verified_scholar: false,
      },
      content,
      beneficial_count: 0,
      is_beneficial: false,
      created_at: new Date().toISOString(),
      parent_comment_id: parentId || null,
      reply_count: 0,
    };

    if (parentId) {
      // Add as a reply
      setComments(prevComments => {
        const updateReplies = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
                reply_count: comment.reply_count + 1,
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: updateReplies(comment.replies),
              };
            }
            return comment;
          });
        };
        return updateReplies(prevComments);
      });
    } else {
      // Add as a top-level comment
      setComments(prevComments => [newComment, ...prevComments]);
    }
  };

  const handleBeneficialToggle = (commentId: string) => {
    setComments(prevComments => {
      const toggleBeneficial = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_beneficial: !comment.is_beneficial,
              beneficial_count: comment.is_beneficial 
                ? comment.beneficial_count - 1 
                : comment.beneficial_count + 1,
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: toggleBeneficial(comment.replies),
            };
          }
          return comment;
        });
      };
      return toggleBeneficial(prevComments);
    });
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "beneficial") {
      return b.beneficial_count - a.beneficial_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayedComments = expanded ? sortedComments.slice(0, visibleComments) : [];

  const loadMore = () => {
    setVisibleComments(prev => prev + 5);
  };

  const hasMore = visibleComments < sortedComments.length;

  return (
    <div className="border-t border-border mt-4">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">
            {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Comment Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("newest")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === "newest"
                        ? "bg-primary-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Newest
                  </button>
                  <button
                    onClick={() => setSortBy("beneficial")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === "beneficial"
                        ? "bg-primary-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Most Beneficial
                  </button>
                </div>
              </div>

              {/* Comment Composer */}
              {showComposer && (
                <div className="mb-4">
                  <CommentComposer
                    postId={postId}
                    onSubmit={(content) => handleAddComment(content)}
                    placeholder="Write a thoughtful comment..."
                    autoFocus
                  />
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {displayedComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onReply={(content, parentId) => handleAddComment(content, parentId)}
                    onBeneficialToggle={handleBeneficialToggle}
                    depth={0}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full"
                  >
                    Load More Comments
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {displayedComments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No comments yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to share your thoughts</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
