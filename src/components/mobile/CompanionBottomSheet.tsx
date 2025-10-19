"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import {
  X,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Heart,
  MapPin,
} from "lucide-react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";
import { Button } from "@/components/ui/button";

interface CompanionSuggestion {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio?: string;
  interests?: string[];
  beneficial_count?: number;
  location?: string;
  mutualHalaqas?: string[];
  compatibilityScore?: number;
  matchReason?: string;
}

interface CompanionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions?: CompanionSuggestion[];
}

/**
 * CompanionBottomSheet - Mobile bottom sheet for daily companion suggestions
 * 
 * Features:
 * - Pulls up from bottom
 * - Swipeable card deck
 * - Quick connect actions
 * - Smooth animations
 */
export function CompanionBottomSheet({
  isOpen,
  onClose,
  suggestions = [],
}: CompanionBottomSheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSalamModal, setShowSalamModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionSuggestion | null>(null);
  const [height, setHeight] = useState("partial"); // partial | full
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  // Mock data if no suggestions provided
  const companionSuggestions: CompanionSuggestion[] = suggestions.length > 0 ? suggestions : [
    {
      id: "1",
      username: "ahmad_seeker",
      full_name: "Ahmad Ibn Abdullah",
      avatar_url: null,
      bio: "Seeking knowledge and righteous companionship. Currently studying Tafsir and Hadith.",
      interests: ["Quran", "Hadith", "Tafsir"],
      beneficial_count: 145,
      location: "London, UK",
      mutualHalaqas: ["Tafsir Study Circle"],
      compatibilityScore: 92,
      matchReason: "You both love Tafsir and are active in similar Halaqas",
    },
    {
      id: "2",
      username: "fatima_scholar",
      full_name: "Fatima Al-Zahir",
      avatar_url: null,
      bio: "Passionate about Islamic history and spirituality. Looking for study partners.",
      interests: ["History", "Arabic", "Spirituality"],
      beneficial_count: 98,
      location: "Toronto, Canada",
      mutualHalaqas: ["Arabic Learning"],
      compatibilityScore: 88,
      matchReason: "Similar activity patterns and learning interests",
    },
    {
      id: "3",
      username: "yusuf_teacher",
      full_name: "Yusuf Al-Hakim",
      avatar_url: null,
      bio: "Teacher of Islamic studies. Available for mentorship in Fiqh and Aqeedah.",
      interests: ["Fiqh", "Aqeedah", "Education"],
      beneficial_count: 234,
      location: "Dubai, UAE",
      mutualHalaqas: [],
      compatibilityScore: 95,
      matchReason: "Excellent mentor match for your learning goals",
    },
  ];

  const currentCompanion = companionSuggestions[currentIndex];
  const hasMore = currentIndex < companionSuggestions.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Swipe down to close
    if (info.offset.y > 150 || info.velocity.y > 500) {
      onClose();
    }
    // Swipe left to next
    else if (info.offset.x < -100) {
      handleNext();
    }
    // Swipe right to previous
    else if (info.offset.x > 100) {
      handlePrevious();
    }
  };

  const handleConnect = (companion: CompanionSuggestion) => {
    setSelectedCompanion(companion);
    setShowSalamModal(true);
  };

  // Reset index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setHeight("partial");
    }
  }, [isOpen]);

  if (!currentCompanion) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ y, opacity }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`
                fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl z-50 md:hidden
                ${height === "full" ? "h-[90vh]" : "h-[75vh]"}
              `}
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-muted rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <h2 className="text-xl font-bold text-foreground">
                      Daily Matches
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {companionSuggestions.length} companions
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CompanionWidget
                      companion={currentCompanion}
                      variant="detailed"
                      mutualHalaqas={currentCompanion.mutualHalaqas}
                      sharedInterests={currentCompanion.interests}
                      compatibilityScore={currentCompanion.compatibilityScore}
                      connectionStatus="none"
                      showActions={false}
                    />

                    {/* Match Reason */}
                    {currentCompanion.matchReason && (
                      <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-1">
                              Why We Matched You
                            </p>
                            <p className="text-sm text-foreground">
                              {currentCompanion.matchReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Swipe hint */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </div>
                      <div className="w-px h-4 bg-border" />
                      <div className="flex items-center gap-1">
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!hasPrevious}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={() => handleConnect(currentCompanion)}
                    className="flex-[2] bg-primary-600 hover:bg-primary-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Salam
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={!hasMore}
                    className="flex-1"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {companionSuggestions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`
                        h-2 rounded-full transition-all
                        ${
                          idx === currentIndex
                            ? "w-6 bg-primary-600"
                            : "w-2 bg-muted-foreground/30"
                        }
                      `}
                    />
                  ))}
                </div>
              </div>

              {/* Expand button */}
              <button
                onClick={() => setHeight(height === "partial" ? "full" : "partial")}
                className="absolute top-4 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <ChevronUp
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    height === "full" ? "rotate-180" : ""
                  }`}
                />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Salam Modal */}
      {selectedCompanion && (
        <SalamModal
          isOpen={showSalamModal}
          onClose={() => setShowSalamModal(false)}
          companion={selectedCompanion}
          matchReason={selectedCompanion.matchReason}
          sharedInterests={selectedCompanion.interests}
          mutualHalaqas={selectedCompanion.mutualHalaqas}
          compatibilityScore={selectedCompanion.compatibilityScore}
          onSuccess={() => {
            setShowSalamModal(false);
            // Move to next companion after connecting
            if (hasMore) {
              setTimeout(() => handleNext(), 500);
            }
          }}
        />
      )}
    </>
  );
}

