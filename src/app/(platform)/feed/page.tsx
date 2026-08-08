"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { PostComposer } from "@/components/feed/PostComposer";
import { WelcomeShamsa } from "@/components/feed/WelcomeShamsa";
import { FeedList } from "@/components/feed/FeedList";

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
                          ? "text-accent-strong"
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

          </div>

          {/* First-open welcome (spec §12) — real gate + dev preview flag */}
          <Suspense fallback={null}>
            <WelcomeShamsa />
          </Suspense>

          {/* Post Composer */}
          <PostComposer onPostCreated={handlePostCreated} />

          {/* Feed */}
          <FeedList key={refreshKey} feedType={activeTab} />
        </div>
      </div>
    </div>
  );
}
