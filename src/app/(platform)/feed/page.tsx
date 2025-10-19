"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PostComposer } from "@/components/feed/PostComposer";
import { FeedList } from "@/components/feed/FeedList";
import { DailyCompanionCard } from "@/components/feed/DailyCompanionCard";
import { createClient } from "@/lib/supabase/client";
import type { CompanionSuggestion } from "@/types/companion";

type FeedTab = "for-you" | "halaqas" | "verified" | "companions";

const FEED_TABS: { id: FeedTab; label: string; description: string }[] = [
  {
    id: "for-you",
    label: "For You",
    description: "Personalized content based on your interests",
  },
  {
    id: "halaqas",
    label: "Halaqas",
    description: "Posts from your study circles",
  },
  {
    id: "verified",
    label: "Verified Voices",
    description: "Content from verified Islamic scholars",
  },
  {
    id: "companions",
    label: "Companions",
    description: "Activity from your Islamic companions",
  },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dailySuggestion, setDailySuggestion] = useState<CompanionSuggestion | null>(null);
  const [showDailySuggestion, setShowDailySuggestion] = useState(false);
  const supabase = createClient();

  // Load daily companion suggestion
  useEffect(() => {
    loadDailySuggestion();
  }, []);

  const loadDailySuggestion = async () => {
    try {
      // Check if user has already seen today's suggestion
      const lastSeenKey = 'daily_companion_last_seen';
      const lastSeen = localStorage.getItem(lastSeenKey);
      const today = new Date().toDateString();

      if (lastSeen === today) {
        return; // Already seen today
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get a high-quality match
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_available_for_connections', true)
        .neq('id', user.id)
        .limit(10);

      if (!profiles || profiles.length === 0) return;

      // Pick one at random (in real app, use the matching algorithm)
      const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];

      // Get user's interests for comparison
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      const sharedInterests = randomProfile.interests?.filter((interest: string) =>
        userProfile?.interests?.includes(interest)
      ) || [];

      const suggestion: CompanionSuggestion = {
        profile: randomProfile,
        match_score: 75 + Math.floor(Math.random() * 20), // 75-95
        shared_interests: sharedInterests,
        reason: sharedInterests.length > 2
          ? "Perfect match based on shared interests!"
          : sharedInterests.length > 0
          ? "You share similar learning goals"
          : "Recommended companion for your journey",
      };

      setDailySuggestion(suggestion);
      setShowDailySuggestion(true);
    } catch (error) {
      console.error('Error loading daily suggestion:', error);
    }
  };

  const handleDismissSuggestion = () => {
    // Mark as seen for today
    const lastSeenKey = 'daily_companion_last_seen';
    const today = new Date().toDateString();
    localStorage.setItem(lastSeenKey, today);
    setShowDailySuggestion(false);
  };

  const handlePostCreated = () => {
    // Refresh feed when new post is created
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="max-w-2xl mx-auto space-y-6 w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Al-Minbar
            </h1>
            <p className="text-sm sm:text-base text-foreground-secondary">
              Share and discover beneficial knowledge
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden w-full">
            <div className="grid grid-cols-4 border-b border-border relative w-full">
              {FEED_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-1.5 sm:px-3 md:px-4 py-3 sm:py-4 text-[10px] sm:text-xs md:text-sm font-medium transition-colors relative text-center
                      ${
                        isActive
                          ? "text-primary-600"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <span className="relative z-10 block truncate leading-tight">{tab.label}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="feed-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Description */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-muted/50">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                {FEED_TABS.find((tab) => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Post Composer */}
          <PostComposer onPostCreated={handlePostCreated} />

          {/* Daily Companion Suggestion */}
          {showDailySuggestion && dailySuggestion && activeTab === "for-you" && (
            <DailyCompanionCard
              suggestion={dailySuggestion}
              onDismiss={handleDismissSuggestion}
            />
          )}

          {/* Feed */}
          <FeedList key={refreshKey} feedType={activeTab} />
        </div>
      </div>
    </div>
  );
}
