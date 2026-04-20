"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronUp, TrendingUp, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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

type SortOption = "newest" | "beneficial";

function transformRow(row: any, replies: Comment[] = []): Comment {
  return {
    id: row.id,
    author: {
      id: row.profiles.id,
      username: row.profiles.username,
      full_name: row.profiles.full_name,
      avatar_url: row.profiles.avatar_url,
      is_verified_scholar: row.profiles.is_verified_scholar ?? false,
    },
    content: row.content,
    beneficial_count: row.beneficial_count ?? 0,
    is_beneficial: false,
    created_at: row.created_at,
    parent_comment_id: row.parent_comment_id,
    replies,
    reply_count: replies.length,
  };
}

export function CommentSection({ postId, commentCount, isExpanded = false }: CommentSectionProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleComments, setVisibleComments] = useState(5);
  const { user, profile } = useSupabaseAuth();
  const supabase = createClient();

  useEffect(() => {
    if (expanded && comments.length === 0) {
      loadComments();
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    setIsLoading(true);
    try {
      // Load top-level comments
      const { data: topLevel, error } = await supabase
        .from("comments")
        .select(`
          id, content, beneficial_count, created_at, parent_comment_id,
          profiles!comments_author_id_fkey (id, username, full_name, avatar_url, is_verified_scholar)
        `)
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !topLevel) {
        console.error("Error loading comments:", error);
        return;
      }

      // Load replies for all top-level comments at once
      const topIds = (topLevel as { id: string }[]).map((c) => c.id);
      const { data: replies } = topIds.length
        ? await supabase
            .from("comments")
            .select(`
              id, content, beneficial_count, created_at, parent_comment_id,
              profiles!comments_author_id_fkey (id, username, full_name, avatar_url, is_verified_scholar)
            `)
            .in("parent_comment_id", topIds)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })
        : { data: [] };

      // Group replies by parent
      const replyMap: Record<string, Comment[]> = {};
      (replies ?? []).forEach((r: any) => {
        const pid = r.parent_comment_id;
        if (!replyMap[pid]) replyMap[pid] = [];
        replyMap[pid].push(transformRow(r));
      });

      setComments(topLevel.map((c: any) => transformRow(c, replyMap[c.id] ?? [])));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddComment(content: string, parentId?: string) {
    if (!user || !profile) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_comment_id: parentId ?? null,
      })
      .select(`
        id, content, beneficial_count, created_at, parent_comment_id,
        profiles!comments_author_id_fkey (id, username, full_name, avatar_url, is_verified_scholar)
      `)
      .single();

    if (error || !data) {
      console.error("Error posting comment:", error);
      return;
    }

    const newComment = transformRow(data);

    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies ?? []), newComment], reply_count: c.reply_count + 1 }
            : c
        )
      );
    } else {
      setComments((prev) => [newComment, ...prev]);
    }
  }

  function handleBeneficialToggle(commentId: string) {
    setComments((prev) => {
      function toggle(list: Comment[]): Comment[] {
        return list.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              is_beneficial: !c.is_beneficial,
              beneficial_count: c.is_beneficial ? c.beneficial_count - 1 : c.beneficial_count + 1,
            };
          }
          return c.replies ? { ...c, replies: toggle(c.replies) } : c;
        });
      }
      return toggle(prev);
    });
  }

  const sorted = [...comments].sort((a, b) =>
    sortBy === "beneficial"
      ? b.beneficial_count - a.beneficial_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const displayed = sorted.slice(0, visibleComments);

  return (
    <div className="border-t border-border mt-4">
      <button
        onClick={() => setExpanded((v) => !v)}
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
              {/* Sort */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                {(["newest", "beneficial"] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === opt
                        ? "bg-primary-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt === "newest" ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {opt === "newest" ? "Newest" : "Most Beneficial"}
                  </button>
                ))}
              </div>

              {/* Composer */}
              {user && (
                <div className="mb-4">
                  <CommentComposer
                    postId={postId}
                    onSubmit={(content) => handleAddComment(content)}
                    placeholder="Write a thoughtful comment..."
                    autoFocus
                  />
                </div>
              )}

              {/* Loading */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No comments yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to share your thoughts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayed.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onReply={(content, parentId) => handleAddComment(content, parentId)}
                      onBeneficialToggle={handleBeneficialToggle}
                      depth={0}
                    />
                  ))}
                </div>
              )}

              {visibleComments < sorted.length && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => setVisibleComments((v) => v + 5)} className="w-full">
                    Load More Comments
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
