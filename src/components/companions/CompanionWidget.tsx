"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageCircle,
  Eye,
  FileText,
  Clock,
  MapPin,
  Heart,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface CompanionWidgetProps {
  companion: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
    interests?: string[];
    beneficial_count?: number;
    location?: string;
    last_active?: string;
  };
  mutualHalaqas?: string[];
  sharedInterests?: string[];
  connectionStatus?: "none" | "pending" | "connected";
  compatibilityScore?: number;
  variant?: "compact" | "default" | "detailed";
  showActions?: boolean;
  onSendSalam?: () => void;
  onViewProfile?: () => void;
  onViewPosts?: () => void;
  onSendMessage?: () => void;
}

/**
 * CompanionWidget - Reusable companion card
 * 
 * Can be embedded anywhere: feeds, Halaqas, search results, etc.
 * Three variants: compact, default, detailed
 */
export function CompanionWidget({
  companion,
  mutualHalaqas = [],
  sharedInterests = [],
  connectionStatus = "none",
  compatibilityScore,
  variant = "default",
  showActions = true,
  onSendSalam,
  onViewProfile,
  onViewPosts,
  onSendMessage,
}: CompanionWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastActiveText = (lastActive?: string) => {
    if (!lastActive) return "Recently active";
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return "Active now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return "Recently active";
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
    } else {
      window.location.href = `/profile/${companion.username}`;
    }
  };

  const handleViewPosts = () => {
    if (onViewPosts) {
      onViewPosts();
    } else {
      window.location.href = `/profile/${companion.username}/posts`;
    }
  };

  // Compact variant - minimal info
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 bg-card hover:bg-muted/50 rounded-lg border border-border transition-colors cursor-pointer"
        onClick={handleViewProfile}
      >
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={companion.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs">
            {getInitials(companion.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {companion.full_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{companion.username}
          </p>
        </div>

        {compatibilityScore && (
          <Badge variant="default" className="text-xs flex-shrink-0">
            {compatibilityScore}%
          </Badge>
        )}

        {connectionStatus === "connected" && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
          </div>
        )}
      </motion.div>
    );
  }

  // Default variant - standard card
  if (variant === "default") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all overflow-hidden hover:shadow-md"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 flex-shrink-0 cursor-pointer" onClick={handleViewProfile}>
              <AvatarImage src={companion.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                {getInitials(companion.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-foreground hover:text-primary-600 cursor-pointer truncate"
                    onClick={handleViewProfile}
                  >
                    {companion.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    @{companion.username}
                  </p>
                </div>

                {compatibilityScore && (
                  <Badge variant="default" className="text-xs flex-shrink-0">
                    {compatibilityScore}% match
                  </Badge>
                )}
              </div>

              {/* Last Active */}
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {getLastActiveText(companion.last_active)}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {companion.bio && (
            <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
              {companion.bio}
            </p>
          )}

          {/* Mutual Halaqas */}
          {mutualHalaqas.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-3 h-3 text-primary-600" />
                <span className="text-xs font-medium text-primary-600">
                  {mutualHalaqas.length} mutual Halaqa{mutualHalaqas.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {mutualHalaqas.slice(0, 2).map((halaqa, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {halaqa}
                  </span>
                ))}
                {mutualHalaqas.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{mutualHalaqas.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Shared Interests */}
          {sharedInterests.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {sharedInterests.slice(0, 3).map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location & Stats */}
          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            {companion.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{companion.location}</span>
              </div>
            )}
            {companion.beneficial_count !== undefined && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{companion.beneficial_count} beneficial</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              {connectionStatus === "none" && onSendSalam && (
                <Button
                  size="sm"
                  onClick={onSendSalam}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Send Salam
                </Button>
              )}

              {connectionStatus === "pending" && (
                <Badge variant="secondary" className="flex-1 justify-center py-1.5">
                  Pending...
                </Badge>
              )}

              {connectionStatus === "connected" && onSendMessage && (
                <Button
                  size="sm"
                  onClick={onSendMessage}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleViewProfile}
              >
                <Eye className="w-4 h-4 mr-1" />
                Profile
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Dropdown Menu */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-muted rounded-lg border border-border"
            >
              <button
                onClick={handleViewPosts}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-background rounded flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Posts
              </button>
              <button
                onClick={handleViewProfile}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-background rounded flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Full Profile
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Detailed variant - full info card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all overflow-hidden hover:shadow-lg"
    >
      {/* Header with gradient */}
      <div className="h-20 bg-gradient-to-r from-primary-500 to-primary-700 relative">
        <div className="absolute -bottom-8 left-4">
          <Avatar className="h-16 w-16 border-4 border-card cursor-pointer" onClick={handleViewProfile}>
            <AvatarImage src={companion.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-lg">
              {getInitials(companion.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {compatibilityScore && (
          <div className="absolute top-3 right-3">
            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              <span className="text-sm font-bold text-primary-600">
                {compatibilityScore}% match
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pt-10">
        {/* Name & Status */}
        <div className="mb-3">
          <h3 
            className="text-lg font-bold text-foreground hover:text-primary-600 cursor-pointer"
            onClick={handleViewProfile}
          >
            {companion.full_name}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">@{companion.username}</p>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              companion.last_active && 
              new Date(companion.last_active).getTime() > Date.now() - 300000 
                ? "bg-success-500" 
                : "bg-muted-foreground"
            }`}></div>
            <span className="text-xs text-muted-foreground">
              {getLastActiveText(companion.last_active)}
            </span>
          </div>
        </div>

        {/* Bio */}
        {companion.bio && (
          <p className="text-sm text-foreground-secondary mb-4 line-clamp-3">
            {companion.bio}
          </p>
        )}

        {/* Mutual Halaqas - Detailed */}
        {mutualHalaqas.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                {mutualHalaqas.length} Mutual Halaqa{mutualHalaqas.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {mutualHalaqas.map((halaqa, idx) => (
                <span key={idx} className="text-xs text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/20 px-2 py-1 rounded">
                  {halaqa}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shared Interests - Detailed */}
        {sharedInterests.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Shared Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {sharedInterests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-lg font-bold text-foreground">
              {companion.beneficial_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Beneficial</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-lg font-bold text-foreground">
              {mutualHalaqas.length}
            </p>
            <p className="text-xs text-muted-foreground">Halaqas</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-lg font-bold text-foreground">
              {sharedInterests.length}
            </p>
            <p className="text-xs text-muted-foreground">Interests</p>
          </div>
        </div>

        {/* Location */}
        {companion.location && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{companion.location}</span>
          </div>
        )}

        {/* Actions - Detailed */}
        {showActions && (
          <div className="space-y-2">
            {connectionStatus === "none" && onSendSalam && (
              <Button
                onClick={onSendSalam}
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send Salam & Connect
              </Button>
            )}

            {connectionStatus === "pending" && (
              <div className="w-full p-3 bg-muted rounded-lg text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Connection Pending
                </p>
              </div>
            )}

            {connectionStatus === "connected" && (
              <div className="grid grid-cols-2 gap-2">
                {onSendMessage && (
                  <Button onClick={onSendMessage}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                )}
                <Button variant="outline" onClick={handleViewPosts}>
                  <FileText className="w-4 h-4 mr-1" />
                  Posts
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleViewProfile}
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Profile
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

