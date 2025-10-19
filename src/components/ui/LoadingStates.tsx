"use client";

import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";

// Shimmer effect for skeleton loaders
const shimmer = {
  hidden: { backgroundPosition: "-1000px 0" },
  visible: {
    backgroundPosition: "1000px 0",
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "linear",
    },
  },
};

// Base skeleton with shimmer
export function SkeletonShimmer({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={shimmer}
      className={`bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:2000px_100%] ${className}`}
      style={{ backgroundSize: "2000px 100%" }}
    />
  );
}

// Spinner variants
export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <Loader2 className={`animate-spin text-primary-600 ${sizeClasses[size]} ${className}`} />
  );
}

// Pulsing dot loader
export function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.2,
            repeatType: "reverse",
          }}
          className="w-2 h-2 bg-primary-600 rounded-full"
        />
      ))}
    </div>
  );
}

// Progress bar for uploads
export function ProgressBar({ progress, className = "" }: { progress: number; className?: string }) {
  return (
    <div className={`w-full bg-muted rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full relative overflow-hidden"
      >
        <motion.div
          animate={{ x: ["0%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
      </motion.div>
    </div>
  );
}

// Upload progress with icon
export function UploadProgress({ progress, filename }: { progress: number; filename: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-lg p-4 shadow-md"
    >
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-5 h-5 text-primary-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{filename}</p>
          <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
        </div>
      </div>
      <ProgressBar progress={progress} />
    </motion.div>
  );
}

// Content skeleton loaders with animations
export function PostSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-lg shadow-md border border-border p-6"
    >
      <div className="flex items-start gap-4 mb-4">
        <SkeletonShimmer className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonShimmer className="h-4 w-32 rounded" />
          <SkeletonShimmer className="h-3 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <SkeletonShimmer className="h-4 w-full rounded" />
        <SkeletonShimmer className="h-4 w-full rounded" />
        <SkeletonShimmer className="h-4 w-3/4 rounded" />
      </div>
      <div className="flex gap-2">
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
      </div>
    </motion.div>
  );
}

export function HalaqaSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
    >
      <SkeletonShimmer className="h-32 w-full" />
      <div className="p-4 space-y-3">
        <SkeletonShimmer className="h-5 w-3/4 rounded" />
        <SkeletonShimmer className="h-4 w-full rounded" />
        <SkeletonShimmer className="h-4 w-2/3 rounded" />
        <div className="flex items-center gap-4 pt-2">
          <SkeletonShimmer className="h-8 w-20 rounded" />
          <SkeletonShimmer className="h-8 flex-1 rounded" />
        </div>
      </div>
    </motion.div>
  );
}

export function ContentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
    >
      <SkeletonShimmer className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <SkeletonShimmer className="h-5 w-full rounded" />
        <SkeletonShimmer className="h-4 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonShimmer className="h-6 w-20 rounded" />
          <SkeletonShimmer className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

export function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
    >
      <SkeletonShimmer className="h-32 w-full" />
      <div className="px-6 pb-6">
        <SkeletonShimmer className="h-24 w-24 rounded-full -mt-12 mb-4 border-4 border-card" />
        <div className="space-y-2 mb-4">
          <SkeletonShimmer className="h-6 w-48 rounded" />
          <SkeletonShimmer className="h-4 w-32 rounded" />
          <SkeletonShimmer className="h-4 w-full rounded" />
          <SkeletonShimmer className="h-4 w-3/4 rounded" />
        </div>
        <div className="flex gap-6">
          <SkeletonShimmer className="h-12 w-20 rounded" />
          <SkeletonShimmer className="h-12 w-20 rounded" />
          <SkeletonShimmer className="h-12 w-20 rounded" />
        </div>
      </div>
    </motion.div>
  );
}

// Staggered list loading
export function SkeletonList({
  count = 3,
  type = "post",
}: {
  count?: number;
  type?: "post" | "halaqa" | "content" | "profile";
}) {
  const SkeletonComponent = {
    post: PostSkeleton,
    halaqa: HalaqaSkeleton,
    content: ContentSkeleton,
    profile: ProfileSkeleton,
  }[type];

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonComponent />
        </motion.div>
      ))}
    </div>
  );
}

// Circular progress indicator
export function CircularProgress({ progress, size = 60 }: { progress: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-primary-600"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Full page loading overlay
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="text-center">
        <Spinner size="lg" className="mb-4 mx-auto" />
        <p className="text-foreground-secondary">{message}</p>
      </div>
    </motion.div>
  );
}

// Success checkmark animation
export function SuccessCheck({ size = 60 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full h-full bg-success/10 rounded-full flex items-center justify-center"
      >
        <motion.svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          className="text-success"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

// Loading dots for buttons
export function ButtonLoading() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.15,
            repeatType: "reverse",
          }}
          className="w-1.5 h-1.5 bg-current rounded-full"
        />
      ))}
    </div>
  );
}
