"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanionProfile } from "@/types/companion";

interface CompanionMatch {
  profile: CompanionProfile;
  compatibility_score: number;
  shared_interests: string[];
  activity_similarity: number;
}

export function useHalaqaCompanions(halaqaId: string) {
  const [matches, setMatches] = useState<CompanionMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (halaqaId) {
      loadCompanionMatches();
    }
  }, [halaqaId]);

  const loadCompanionMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      // Get Halaqa members (excluding current user)
      const { data: members } = await supabase
        .from('halaqa_members')
        .select(`
          user_id,
          profiles (*)
        `)
        .eq('halaqa_id', halaqaId)
        .neq('user_id', user.id);

      if (!members || members.length === 0) return;

      // Get existing connections to filter out
      const { data: existingConnections } = await supabase
        .from('companion_connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const connectedUserIds = new Set(
        existingConnections?.flatMap(c => [c.requester_id, c.recipient_id]) || []
      );

      // Calculate compatibility for each member
      const compatibilityMatches: CompanionMatch[] = members
        .filter(m => m.profiles && !connectedUserIds.has(m.user_id))
        .map(member => {
          const profile = member.profiles as any;
          
          // Calculate shared interests
          const sharedInterests = (profile.interests || []).filter(
            (interest: string) => userProfile.interests?.includes(interest)
          );

          // Calculate compatibility score (0-100)
          let score = 50; // Base score

          // Shared interests boost (up to +30)
          score += Math.min(sharedInterests.length * 10, 30);

          // Activity level similarity (up to +20)
          const userActivity = userProfile.beneficial_count || 0;
          const memberActivity = profile.beneficial_count || 0;
          const activityDiff = Math.abs(userActivity - memberActivity);
          const activityScore = Math.max(0, 20 - activityDiff / 5);
          score += activityScore;

          const activitySimilarity = Math.round(
            100 - (activityDiff / Math.max(userActivity, memberActivity, 1)) * 100
          );

          return {
            profile: {
              ...profile,
              companion_score: score,
              is_available_for_connections: profile.is_available_for_connections ?? true,
              connection_capacity: profile.connection_capacity ?? 50,
              last_active: profile.last_active || new Date().toISOString(),
              personality_traits: profile.personality_traits || [],
            },
            compatibility_score: Math.min(Math.round(score), 100),
            shared_interests: sharedInterests,
            activity_similarity: Math.max(0, Math.min(activitySimilarity, 100)),
          };
        })
        .filter(m => m.profile.is_available_for_connections)
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, 3); // Top 3 matches

      setMatches(compatibilityMatches);
    } catch (error) {
      console.error('Error loading companion matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    matches,
    loading,
    refresh: loadCompanionMatches,
  };
}

