"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Clock,
  FileText,
  Trophy,
  Eye,
  Check,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";

interface DebateCardProps {
  debate: {
    id: string;
    topic: string;
    description: string;
    status: "pending" | "ongoing" | "completed" | "cancelled";
    current_round: number;
    max_rounds: number;
    participant_a: {
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      is_verified_scholar: boolean;
    };
    participant_b: {
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      is_verified_scholar: boolean;
    };
    votes?: {
      participant_a: number;
      participant_b: number;
      total: number;
    };
    winner_id?: string | null;
    created_at: string;
    time_remaining?: number;
  };
  onClick?: () => void;
}

export function DebateCard({ debate, onClick }: DebateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = () => {
    switch (debate.status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "ongoing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getVotePercentage = (participantId: string) => {
    if (!debate.votes || debate.votes.total === 0) return 50;
    const votes = participantId === debate.participant_a.id 
      ? debate.votes.participant_a 
      : debate.votes.participant_b;
    return Math.round((votes / debate.votes.total) * 100);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const CardWrapper = onClick ? motion.button : motion.div;
  const linkProps = onClick ? {} : { as: Link, href: `/debates/${debate.id}` };

  return (
    <CardWrapper
      {...linkProps}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-all overflow-hidden w-full text-left"
    >
      {/* Header with Status */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">Scholarly Debate</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor()}`}>
            {debate.status.charAt(0).toUpperCase() + debate.status.slice(1)}
          </span>
        </div>
        <h3 className="text-lg font-bold line-clamp-2">{debate.topic}</h3>
      </div>

      {/* Participants */}
      <div className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          {/* Participant A */}
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-blue-500">
              <AvatarImage src={debate.participant_a.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm">
                {getInitials(debate.participant_a.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground text-sm">
                  {debate.participant_a.full_name}
                </span>
                {debate.participant_a.is_verified_scholar && (
                  <Check className="w-3 h-3 text-primary-500 fill-primary-500" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                @{debate.participant_a.username}
              </span>
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              VS
            </div>
          </div>

          {/* Participant B */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="font-semibold text-foreground text-sm">
                  {debate.participant_b.full_name}
                </span>
                {debate.participant_b.is_verified_scholar && (
                  <Check className="w-3 h-3 text-primary-500 fill-primary-500" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                @{debate.participant_b.username}
              </span>
            </div>
            <Avatar className="h-10 w-10 border-2 border-green-500">
              <AvatarImage src={debate.participant_b.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white text-sm">
                {getInitials(debate.participant_b.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4">
        <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
          {debate.description}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>Round {debate.current_round}/{debate.max_rounds}</span>
          </div>
          
          {debate.status === "ongoing" && debate.time_remaining && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(debate.time_remaining)} left</span>
            </div>
          )}

          {debate.votes && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{debate.votes.total} spectators</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatRelativeTime(debate.created_at)}</span>
          </div>
        </div>

        {/* Vote Results (if completed) */}
        {debate.status === "completed" && debate.votes && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-foreground">{debate.participant_a.full_name}</span>
              </div>
              <span className="font-bold text-blue-600">
                {getVotePercentage(debate.participant_a.id)}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
              <div 
                className="bg-blue-600 h-2 transition-all"
                style={{ width: `${getVotePercentage(debate.participant_a.id)}%` }}
              />
              <div 
                className="bg-green-600 h-2 transition-all"
                style={{ width: `${getVotePercentage(debate.participant_b.id)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <span className="text-foreground">{debate.participant_b.full_name}</span>
              </div>
              <span className="font-bold text-green-600">
                {getVotePercentage(debate.participant_b.id)}%
              </span>
            </div>

            {/* Winner Badge */}
            {debate.winner_id && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-white">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">
                    Winner: {debate.winner_id === debate.participant_a.id 
                      ? debate.participant_a.full_name 
                      : debate.participant_b.full_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Hint */}
        {debate.status === "ongoing" && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Debate in progress - Click to watch</span>
            </div>
          </div>
        )}

        {debate.status === "completed" && !debate.votes && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">Debate completed - Click to view results</span>
            </div>
          </div>
        )}

        {debate.status === "pending" && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Waiting for opponent to accept</span>
            </div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
