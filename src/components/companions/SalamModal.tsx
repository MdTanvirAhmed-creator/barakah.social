"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Heart,
  Users,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface SalamModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
    interests?: string[];
  };
  matchReason?: string;
  sharedInterests?: string[];
  mutualHalaqas?: string[];
  compatibilityScore?: number;
  onSuccess?: () => void;
}

/**
 * SalamModal - Beautiful modal for sending connection requests
 * 
 * Features:
 * - Optional personalized message
 * - Shows why you matched
 * - Displays shared interests
 * - Islamic etiquette reminders
 * - Beautiful animations
 */
export function SalamModal({
  isOpen,
  onClose,
  companion,
  matchReason,
  sharedInterests = [],
  mutualHalaqas = [],
  compatibilityScore,
  onSuccess,
}: SalamModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const defaultSalamMessages = [
    `Assalamu alaikum ${companion.full_name.split(" ")[0]}! I noticed we share similar interests. Would love to connect!`,
    `السلام عليكم! I came across your profile and would like to be companions on this journey of knowledge.`,
    `Assalamu alaikum! May Allah bless you. I'd like to connect as we seem to have common interests in Islamic studies.`,
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSend = async () => {
    setSending(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to send Salam");
        setSending(false);
        return;
      }

      // Create companion connection request
      const { error } = await supabase
        .from("companion_connections")
        .insert({
          requester_id: user.id,
          recipient_id: companion.id,
          status: "pending",
          message: message || defaultSalamMessages[0],
          connection_strength: 50, // Default starting strength
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast.error("You've already sent a request to this companion");
        } else {
          throw error;
        }
        setSending(false);
        return;
      }

      // Success!
      setSent(true);
      toast.success("Salam sent! 🤲");

      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSent(false);
        setMessage("");
      }, 2000);

    } catch (error) {
      console.error("Error sending Salam:", error);
      toast.error("Failed to send Salam. Please try again.");
      setSending(false);
    }
  };

  const handleUseTemplate = (template: string) => {
    setMessage(template);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Send Salam</h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-primary-100">
              Connect with {companion.full_name} and start your journey together
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success State */}
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-success-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Salam Sent! 🤲
                </h3>
                <p className="text-muted-foreground">
                  May Allah accept your connection
                </p>
              </motion.div>
            ) : (
              <>
                {/* Companion Profile */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={companion.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-lg">
                      {getInitials(companion.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {companion.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      @{companion.username}
                    </p>
                    {companion.bio && (
                      <p className="text-sm text-foreground-secondary line-clamp-2">
                        {companion.bio}
                      </p>
                    )}
                  </div>

                  {compatibilityScore && (
                    <Badge variant="default" className="flex-shrink-0">
                      {compatibilityScore}% match
                    </Badge>
                  )}
                </div>

                {/* Why We Matched You */}
                {(matchReason || sharedInterests.length > 0 || mutualHalaqas.length > 0) && (
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-primary-700 dark:text-primary-400">
                        Why We Matched You
                      </h4>
                    </div>

                    {matchReason && (
                      <p className="text-sm text-foreground mb-3">{matchReason}</p>
                    )}

                    {/* Shared Interests */}
                    {sharedInterests.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-foreground">
                            {sharedInterests.length} Shared Interest{sharedInterests.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sharedInterests.map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mutual Halaqas */}
                    {mutualHalaqas.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <Users className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-foreground">
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
                  </div>
                )}

                {/* Message Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Personalized Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={defaultSalamMessages[0]}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {message.length}/500 characters
                    </span>
                    <button
                      onClick={() => setMessage("")}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Message Templates */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Or use a template:
                  </p>
                  <div className="space-y-2">
                    {defaultSalamMessages.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUseTemplate(template)}
                        className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Islamic Etiquette Reminder */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                        Islamic Etiquette Reminder
                      </h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• Start with &quot;Assalamu alaikum&quot; (Peace be upon you)</li>
                        <li>• Be respectful and sincere in your intentions</li>
                        <li>• Maintain proper Islamic boundaries</li>
                        <li>• Connect for the sake of learning and growing in faith</li>
                        <li>• May Allah bless your companionship</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    className="flex-1 bg-primary-600 hover:bg-primary-700"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Salam
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

