"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Lock,
  Globe,
  Crown,
  UserCheck,
  MoreHorizontal,
  BookOpen,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { useToast } from "@/hooks/useToast";

interface HalaqaCardProps {
  halaqa: {
    id: string;
    name: string;
    description: string;
    category: string;
    member_count: number;
    max_members: number;
    is_public: boolean;
    cover_image?: string | null;
    rules: string[];
    created_at: string;
    last_activity: string;
    members: Array<{ id: string; name: string; avatar?: string | null }>;
    is_member: boolean;
    role?: "admin" | "moderator" | "member" | null;
  };
  viewMode: "grid" | "list";
}

const CATEGORY_COLORS = {
  Quran: "from-emerald-500 to-teal-600",
  Hadith: "from-blue-500 to-indigo-600",
  Fiqh: "from-purple-500 to-violet-600",
  History: "from-amber-500 to-orange-600",
  Spirituality: "from-pink-500 to-rose-600",
  Contemporary: "from-gray-500 to-slate-600",
  Family: "from-green-500 to-emerald-600",
  Finance: "from-yellow-500 to-amber-600",
};

const CATEGORY_ICONS = {
  Quran: "📖",
  Hadith: "📜",
  Fiqh: "⚖️",
  History: "📚",
  Spirituality: "🕯️",
  Contemporary: "🌍",
  Family: "👨‍👩‍👧‍👦",
  Finance: "💰",
};

export function HalaqaCard({ halaqa, viewMode }: HalaqaCardProps) {
  const { success, error: showError } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(halaqa.is_member);

  const gradientClass = CATEGORY_COLORS[halaqa.category as keyof typeof CATEGORY_COLORS] || "from-gray-500 to-slate-600";
  const categoryIcon = CATEGORY_ICONS[halaqa.category as keyof typeof CATEGORY_ICONS] || "📚";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleJoinLeave = async () => {
    setIsJoining(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setIsMember(!isMember);
      success(isMember ? "Left Halaqa successfully" : "Joined Halaqa successfully!");
    } catch (err) {
      showError("Failed to update membership. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const isFull = halaqa.member_count >= halaqa.max_members;

  if (viewMode === "list") {
    return (
      <Link href={`/halaqas/${halaqa.id}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all p-6"
        >
          <div className="flex items-start gap-4">
            {/* Cover/Icon */}
            <div className={`w-16 h-16 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
              {categoryIcon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {halaqa.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{halaqa.category}</span>
                    <span>•</span>
                    {halaqa.is_public ? (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {halaqa.role && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      halaqa.role === "admin" 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : halaqa.role === "moderator"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    }`}>
                      {halaqa.role === "admin" && <Crown className="w-3 h-3" />}
                      {halaqa.role === "moderator" && <UserCheck className="w-3 h-3" />}
                      {halaqa.role}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-foreground-secondary text-sm mb-3 line-clamp-2">
                {halaqa.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {/* Members */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{halaqa.member_count}/{halaqa.max_members}</span>
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>{formatRelativeTime(halaqa.last_activity)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleJoinLeave();
                  }}
                  disabled={isJoining || (!isMember && isFull)}
                  size="sm"
                  className={`
                    ${isMember 
                      ? "bg-secondary-600 hover:bg-secondary-700 text-white" 
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                    }
                    ${isFull && !isMember ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isJoining ? (
                    "Processing..."
                  ) : isMember ? (
                    "Leave"
                  ) : isFull ? (
                    "Full"
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Grid View
  return (
    <Link href={`/halaqas/${halaqa.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden"
      >
        {/* Cover */}
        <div className={`h-32 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {halaqa.is_public ? (
              <Globe className="w-4 h-4 text-white" />
            ) : (
              <Lock className="w-4 h-4 text-white" />
            )}
            {halaqa.role && (
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                halaqa.role === "admin" 
                  ? "bg-red-500/80 text-white"
                  : halaqa.role === "moderator"
                  ? "bg-blue-500/80 text-white"
                  : "bg-green-500/80 text-white"
              }`}>
                {halaqa.role}
              </div>
            )}
          </div>
          <div className="absolute bottom-3 right-3 text-3xl">
            {categoryIcon}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
              {halaqa.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{halaqa.category}</span>
              <span>•</span>
              <span>{formatRelativeTime(halaqa.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-foreground-secondary text-sm mb-4 line-clamp-2">
            {halaqa.description}
          </p>

          {/* Members */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {halaqa.members.slice(0, 3).map((member, index) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={member.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {halaqa.member_count > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{halaqa.member_count - 3}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <Users className="w-4 h-4 inline mr-1" />
                {halaqa.member_count}/{halaqa.max_members}
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <Activity className="w-3 h-3" />
            <span>Active {formatRelativeTime(halaqa.last_activity)}</span>
          </div>

          {/* Action Button */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleJoinLeave();
            }}
            disabled={isJoining || (!isMember && isFull)}
            className={`w-full ${
              isMember 
                ? "bg-secondary-600 hover:bg-secondary-700 text-white" 
                : "bg-primary-600 hover:bg-primary-700 text-white"
            } ${isFull && !isMember ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isJoining ? (
              "Processing..."
            ) : isMember ? (
              "Leave Halaqa"
            ) : isFull ? (
              "Halaqa is Full"
            ) : (
              "Join Halaqa"
            )}
          </Button>
        </div>
      </motion.div>
    </Link>
  );
}
