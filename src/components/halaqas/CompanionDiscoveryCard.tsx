"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import type { CompanionProfile } from "@/types/companion";

interface CompanionMatch {
  profile: CompanionProfile;
  compatibility_score: number;
  shared_interests: string[];
  activity_similarity: number;
}

interface CompanionDiscoveryCardProps {
  halaqaId: string;
  halaqaTopic: string;
  matches: CompanionMatch[];
}

export function CompanionDiscoveryCard({
  halaqaId,
  halaqaTopic,
  matches,
}: CompanionDiscoveryCardProps) {
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const { success } = useToast();
  const supabase = createClient();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-primary-600";
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Potential Match";
  };

  const handleConnect = async (userId: string, userName: string) => {
    setSendingTo(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('companion_connections')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'pending') {
          success("Connection request already pending");
        } else if (existing.status === 'accepted') {
          success("Already companions!");
        } else {
          success("Please try again");
        }
        return;
      }

      // Create connection request
      const { error } = await supabase
        .from('companion_connections')
        .insert({
          requester_id: user.id,
          recipient_id: userId,
          status: 'pending',
          message: `Assalamu alaikum! I noticed we're both in the ${halaqaTopic} Halaqa and share similar interests. Would love to connect as study companions! 🤝`
        });

      if (error) throw error;

      success(`Salam sent to ${userName}!`);
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setSendingTo(null);
    }
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg shadow-md border-2 border-primary-200 dark:border-primary-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Find Companions Here</h3>
        </div>
        <p className="text-white/80 text-sm mt-1">
          Members with similar interests and learning goals
        </p>
      </div>

      {/* Matches */}
      <div className="p-4 space-y-3">
        {matches.map((match, index) => (
          <motion.div
            key={match.profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-border"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={match.profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                  {getInitials(match.profile.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {match.profile.full_name}
                  </h4>
                  <span className={`text-xs font-medium ${getCompatibilityColor(match.compatibility_score)}`}>
                    {match.compatibility_score}%
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  @{match.profile.username}
                </p>

                {/* Compatibility Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-gray-700 ${getCompatibilityColor(match.compatibility_score)}`}>
                    <TrendingUp className="w-3 h-3" />
                    {getCompatibilityLabel(match.compatibility_score)}
                  </div>
                  {match.activity_similarity >= 70 && (
                    <span className="text-xs text-muted-foreground">
                      • Similar activity level
                    </span>
                  )}
                </div>

                {/* Shared Interests Beyond Halaqa Topic */}
                {match.shared_interests.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Also interested in:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.shared_interests.slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="text-xs bg-secondary-100 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-2 py-0.5 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {match.shared_interests.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{match.shared_interests.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Personality Traits */}
                {match.profile.personality_traits && match.profile.personality_traits.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {match.profile.personality_traits.slice(0, 2).map((trait) => (
                        <span
                          key={trait}
                          className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connect Button */}
                <Button
                  size="sm"
                  onClick={() => handleConnect(match.profile.id, match.profile.full_name)}
                  disabled={sendingTo === match.profile.id}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {sendingTo === match.profile.id ? "Sending..." : "Send Salam & Connect"}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-muted/50 px-4 py-3 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          💡 Building connections through shared learning strengthens your journey
        </p>
      </div>
    </div>
  );
}

