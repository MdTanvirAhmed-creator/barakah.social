"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, X, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import type { CompanionSuggestion } from "@/types/companion";

interface DailyCompanionCardProps {
  suggestion: CompanionSuggestion;
  onDismiss: () => void;
}

export function DailyCompanionCard({ suggestion, onDismiss }: DailyCompanionCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isSending, setIsSending] = useState(false);
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

  const handleSendSalam = async () => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create connection request
      const { error } = await supabase
        .from('companion_connections')
        .insert({
          requester_id: user.id,
          recipient_id: suggestion.profile.id,
          status: 'pending',
          message: `Assalamu alaikum! I noticed we share interests in ${suggestion.shared_interests.slice(0, 2).join(' and ')}. Would love to connect as companions on this journey! 🤝`
        });

      if (error) throw error;

      success("Salam sent! Connection request pending");
      handleDismiss();
    } catch (error) {
      console.error('Error sending salam:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getConnectionStrengthColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-primary-600";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg shadow-md border-2 border-primary-200 dark:border-primary-800 overflow-hidden mb-6 w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Today&apos;s Companion Suggestion</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 sm:border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0">
                  <AvatarImage src={suggestion.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-lg sm:text-xl">
                    {getInitials(suggestion.profile.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h4 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {suggestion.profile.full_name}
                    </h4>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-medium flex-shrink-0 ${getConnectionStrengthColor(suggestion.match_score)}`}>
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{suggestion.match_score}%</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    @{suggestion.profile.username}
                  </p>

                  {/* Reason */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <p className="text-sm text-foreground font-medium mb-1">
                      {suggestion.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.profile.bio || "Looking forward to meaningful connections and shared learning."}
                    </p>
                  </div>

                  {/* Shared Interests */}
                  {suggestion.shared_interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {suggestion.shared_interests.map((interest) => (
                        <span
                          key={interest}
                          className="text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Personality Traits */}
                  {suggestion.profile.personality_traits && suggestion.profile.personality_traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs text-muted-foreground">Character:</span>
                      {suggestion.profile.personality_traits.slice(0, 3).map((trait) => (
                        <span
                          key={trait}
                          className="text-xs bg-secondary-100 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-2 py-1 rounded-full capitalize"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleSendSalam}
                      disabled={isSending}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {isSending ? "Sending..." : "Send Salam"}
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="bg-muted/50 px-3 sm:px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Building strong connections takes time. Start with a friendly salam!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

