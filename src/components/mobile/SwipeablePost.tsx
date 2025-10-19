"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { UserPlus, Bookmark, BookmarkCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SwipeablePostProps {
  postId: string;
  authorId: string;
  authorName: string;
  authorAcceptsCompanions?: boolean;
  isBookmarked?: boolean;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  children: React.ReactNode;
}

/**
 * SwipeablePost - Mobile-optimized post with swipe gestures
 * 
 * Swipe right → View companion profile / Send Salam
 * Swipe left → Bookmark / Save for later
 */
export function SwipeablePost({
  postId,
  authorId,
  authorName,
  authorAcceptsCompanions = true,
  isBookmarked = false,
  onSwipeRight,
  onSwipeLeft,
  children,
}: SwipeablePostProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);

  // Background color for swipe feedback
  const backgroundColor = useTransform(
    x,
    [-150, -50, 0, 50, 150],
    [
      "rgba(59, 130, 246, 0.2)", // Left (blue for bookmark)
      "rgba(59, 130, 246, 0.1)",
      "rgba(0, 0, 0, 0)",
      "rgba(34, 197, 94, 0.1)",
      "rgba(34, 197, 94, 0.2)", // Right (green for companion)
    ]
  );

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Swipe right - Companion action
    if (offset > threshold || velocity > 500) {
      setSwipeDirection("right");
      
      if (authorAcceptsCompanions) {
        toast.success(`${authorName} accepts companions!`, {
          description: "Swipe up to send a connection request",
          action: {
            label: "View Profile",
            onClick: () => window.location.href = `/profile/${authorId}`,
          },
        });
        onSwipeRight?.();
      } else {
        toast.info(`${authorName} is not currently accepting companion requests`);
      }

      // Reset after animation
      setTimeout(() => {
        x.set(0);
        setSwipeDirection(null);
      }, 300);
    }
    // Swipe left - Bookmark action
    else if (offset < -threshold || velocity < -500) {
      setSwipeDirection("left");
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to bookmark posts");
          x.set(0);
          setSwipeDirection(null);
          return;
        }

        if (bookmarked) {
          // Remove bookmark
          const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("post_id", postId);

          if (error) throw error;

          setBookmarked(false);
          toast.success("Bookmark removed");
        } else {
          // Add bookmark
          const { error } = await supabase
            .from("bookmarks")
            .insert({
              user_id: user.id,
              post_id: postId,
              created_at: new Date().toISOString(),
            });

          if (error) throw error;

          setBookmarked(true);
          toast.success("Saved for later!");
        }

        onSwipeLeft?.();
      } catch (error) {
        console.error("Bookmark error:", error);
        toast.error("Failed to save. Try again.");
      }

      // Reset after animation
      setTimeout(() => {
        x.set(0);
        setSwipeDirection(null);
      }, 300);
    } else {
      // Snap back to center
      x.set(0);
      setSwipeDirection(null);
    }
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-lg mb-4">
      {/* Background indicators */}
      <motion.div
        style={{ backgroundColor }}
        className="absolute inset-0 rounded-lg"
      />

      {/* Left swipe indicator (Bookmark) */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-0"
        style={{
          opacity: useTransform(x, [0, -150], [0, 1]),
          scale: useTransform(x, [0, -150], [0.5, 1]),
        }}
      >
        <div className="flex flex-col items-center gap-2 text-primary-600">
          {bookmarked ? (
            <BookmarkCheck className="w-8 h-8" />
          ) : (
            <Bookmark className="w-8 h-8" />
          )}
          <span className="text-xs font-semibold whitespace-nowrap">
            {bookmarked ? "Remove" : "Save"}
          </span>
        </div>
      </motion.div>

      {/* Right swipe indicator (Companion) */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-0"
        style={{
          opacity: useTransform(x, [0, 150], [0, 1]),
          scale: useTransform(x, [0, 150], [0.5, 1]),
        }}
      >
        <div className="flex flex-col items-center gap-2 text-success-600">
          <UserPlus className="w-8 h-8" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {authorAcceptsCompanions ? "Connect" : "View"}
          </span>
        </div>
      </motion.div>

      {/* Post content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        className="relative z-10 bg-card rounded-lg touch-pan-y"
      >
        {children}
      </motion.div>

      {/* Swipe hint on first render (optional) */}
      {!swipeDirection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-2 right-2 z-20 bg-muted/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-muted-foreground pointer-events-none"
        >
          ← Swipe →
        </motion.div>
      )}
    </div>
  );
}

