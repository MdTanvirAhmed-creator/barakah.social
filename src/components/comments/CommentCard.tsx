"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { useToast } from "@/hooks/useToast";
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

interface CommentCardProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => void;
  onBeneficialToggle: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export function CommentCard({
  comment,
  onReply,
  onBeneficialToggle,
  depth = 0,
  maxDepth = 3,
}: CommentCardProps) {
  const { success, error: showError } = useToast();
  const [showFullContent, setShowFullContent] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const isLongComment = comment.content.length > 280;
  const displayContent = isLongComment && !showFullContent 
    ? comment.content.substring(0, 280) + "..." 
    : comment.content;

  const handleBeneficial = () => {
    onBeneficialToggle(comment.id);
  };

  const handleReply = (content: string) => {
    onReply(content, comment.id);
    setShowReplyBox(false);
    success("Reply posted successfully!");
  };

  const handleReport = () => {
    setShowMenu(false);
    success("Comment reported. Our moderation team will review it.");
  };

  const handleEdit = () => {
    setShowMenu(false);
    // In production, this would open an edit modal
    success("Edit functionality coming soon!");
  };

  const handleDelete = () => {
    setShowMenu(false);
    // In production, this would delete the comment
    success("Comment deleted successfully!");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine if we should show reply button
  const canReply = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-2">
          <Link href={`/profile/${comment.author.username}`}>
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={comment.author.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs">
                {getInitials(comment.author.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${comment.author.username}`}
                className="font-semibold text-sm text-foreground hover:text-primary-600 transition-colors"
              >
                {comment.author.full_name}
              </Link>
              {comment.author.is_verified_scholar && (
                <Check className="w-4 h-4 text-primary-500 fill-primary-500" />
              )}
              <span className="text-xs text-muted-foreground">
                @{comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>

            {/* Content */}
            <div className="text-sm text-foreground-secondary mb-2 whitespace-pre-wrap break-words">
              {displayContent}
              {isLongComment && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-primary-600 hover:underline ml-1 font-medium"
                >
                  {showFullContent ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBeneficial}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.is_beneficial
                    ? "text-primary-600"
                    : "text-muted-foreground hover:text-primary-600"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${comment.is_beneficial ? "fill-primary-600" : ""}`}
                />
                <span>{comment.beneficial_count}</span>
                <span className="hidden sm:inline">Beneficial</span>
              </button>

              {canReply && (
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              )}

              {comment.reply_count > 0 && depth === 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 transition-colors"
                >
                  {showReplies ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span>
                    {comment.reply_count} {comment.reply_count === 1 ? "Reply" : "Replies"}
                  </span>
                </button>
              )}

              {/* More Options Menu */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />

                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-6 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
                      >
                        <button
                          onClick={handleReport}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>

                        {/* Show edit/delete for own comments (mock check) */}
                        {comment.author.id === "current-user" && (
                          <>
                            <button
                              onClick={handleEdit}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Reply Composer */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-11 mt-2 overflow-hidden"
            >
              <CommentComposer
                postId={comment.id}
                onSubmit={handleReply}
                onCancel={() => setShowReplyBox(false)}
                placeholder={`Reply to @${comment.author.username}...`}
                autoFocus
                showCancel
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        <AnimatePresence>
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-3"
            >
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onBeneficialToggle={onBeneficialToggle}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
