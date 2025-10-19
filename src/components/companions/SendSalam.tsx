"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Users,
  MessageCircle,
  Heart,
  MapPin,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SendSalamProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
    interests?: string[];
    location?: string;
  };
  context?: {
    metIn?: "halaqa" | "knowledge" | "feed" | "search" | "tools";
    halaqaName?: string;
    halaqaId?: string;
    learningPath?: string;
    sharedInterests?: string[];
    mutualConnections?: string[];
    compatibilityScore?: number;
  };
  onSuccess?: () => void;
}

const MESSAGE_TEMPLATES = [
  {
    id: "general",
    label: "General",
    text: "Assalamu alaikum! I came across your profile and would love to connect as companions on this journey of learning and faith. May Allah bless our connection.",
  },
  {
    id: "halaqa",
    label: "From Halaqa",
    text: "Assalamu alaikum! I noticed you in {halaqaName}. Would be great to connect and support each other in our studies. JazakAllah khair!",
  },
  {
    id: "knowledge",
    label: "Study Partner",
    text: "السلام عليكم! I see we're both interested in {interest}. Would you like to be study partners? Looking forward to learning together!",
  },
  {
    id: "mentor",
    label: "Seeking Guidance",
    text: "Assalamu alaikum! I'm seeking to deepen my knowledge in {interest}. Would you be open to mentoring or sharing insights? May Allah reward you.",
  },
];

/**
 * SendSalam - Component for initiating companion connections
 * 
 * Features:
 * - Context-aware messaging
 * - Pre-filled templates
 * - 280 character limit
 * - Islamic etiquette
 * - Beautiful animations
 */
export function SendSalam({
  isOpen,
  onClose,
  recipient,
  context,
  onSuccess,
}: SendSalamProps) {
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const maxLength = 280;
  const remainingChars = maxLength - message.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const applyTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    let text = template.text;

    // Replace placeholders
    if (context?.halaqaName) {
      text = text.replace("{halaqaName}", context.halaqaName);
    }
    if (context?.sharedInterests && context.sharedInterests.length > 0) {
      text = text.replace("{interest}", context.sharedInterests[0]);
    }

    setMessage(text);
    setSelectedTemplate(template.id);
  };

  const getContextSummary = () => {
    if (!context) return null;

    const parts: string[] = [];

    if (context.metIn === "halaqa" && context.halaqaName) {
      parts.push(`📚 Met in: ${context.halaqaName}`);
    }
    if (context.learningPath) {
      parts.push(`🎓 Learning: ${context.learningPath}`);
    }
    if (context.sharedInterests && context.sharedInterests.length > 0) {
      parts.push(`❤️ Shared: ${context.sharedInterests.slice(0, 2).join(", ")}`);
    }
    if (context.mutualConnections && context.mutualConnections.length > 0) {
      parts.push(`🤝 ${context.mutualConnections.length} mutual companion${context.mutualConnections.length > 1 ? "s" : ""}`);
    }

    return parts;
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please write a message or select a template");
      return;
    }

    if (message.length > maxLength) {
      toast.error(`Message too long (max ${maxLength} characters)`);
      return;
    }

    setSending(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to send Salam");
        setSending(false);
        return;
      }

      // Check for existing connection
      const { data: existing } = await supabase
        .from("companion_connections")
        .select("id, status")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(requester_id.eq.${recipient.id},recipient_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === "pending") {
          toast.info("You already have a pending request with this companion");
        } else if (existing.status === "accepted") {
          toast.info("You're already connected with this companion!");
        } else if (existing.status === "declined") {
          toast.error("Previous request was declined. Please respect their decision.");
        }
        setSending(false);
        return;
      }

      // Create connection request
      const { error: connectionError } = await supabase
        .from("companion_connections")
        .insert({
          requester_id: user.id,
          recipient_id: recipient.id,
          status: "pending",
          message: message.trim(),
          connection_strength: 50, // Default starting strength
          created_at: new Date().toISOString(),
        });

      if (connectionError) throw connectionError;

      // Create interaction record
      await supabase
        .from("companion_interactions")
        .insert({
          companion_connection_id: null, // Will be updated when accepted
          interaction_type: "message_sent",
          created_at: new Date().toISOString(),
        });

      // Success!
      setSent(true);
      toast.success("Salam sent! 🤲", {
        description: "May Allah accept your connection",
      });

      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSent(false);
        setMessage("");
        setSelectedTemplate(null);
      }, 2000);

    } catch (error) {
      console.error("Error sending Salam:", error);
      toast.error("Failed to send Salam. Please try again.");
      setSending(false);
    }
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
          {/* Success State */}
          {sent ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-10 h-10 text-success-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Salam Sent! 🤲
              </h3>
              <p className="text-muted-foreground mb-1">
                Your message has been delivered to {recipient.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                May Allah bless your companionship
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Send className="w-6 h-6" />
                    Send Salam
                  </h2>
                  <button
                    onClick={onClose}
                    disabled={sending}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-primary-100">
                  Start with &quot;Assalamu alaikum&quot; - May peace be upon you
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Recipient Profile */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                      <AvatarImage src={recipient.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-lg">
                        {getInitials(recipient.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {recipient.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        @{recipient.username}
                      </p>
                      {recipient.bio && (
                        <p className="text-sm text-foreground-secondary line-clamp-2">
                          {recipient.bio}
                        </p>
                      )}

                      {/* Interests */}
                      {recipient.interests && recipient.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipient.interests.slice(0, 3).map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {context?.compatibilityScore && (
                      <Badge variant="default" className="flex-shrink-0">
                        {context.compatibilityScore}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Context Summary */}
                {getContextSummary() && (
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <h4 className="font-semibold text-primary-700 dark:text-primary-400">
                        Connection Context
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {getContextSummary()!.map((item, idx) => (
                        <p key={idx} className="text-sm text-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Templates */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MESSAGE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        disabled={sending}
                        className={`
                          p-3 text-left rounded-lg border-2 transition-all
                          ${
                            selectedTemplate === template.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-border bg-muted hover:bg-muted/80"
                          }
                        `}
                      >
                        <p className="text-sm font-medium text-foreground mb-1">
                          {template.label}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.text.substring(0, 60)}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Assalamu alaikum! I would love to connect..."
                    disabled={sending}
                    className="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary-500 rounded-lg focus:outline-none resize-none"
                    rows={4}
                    maxLength={maxLength}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs ${
                        remainingChars < 20
                          ? "text-error"
                          : "text-muted-foreground"
                      }`}
                    >
                      {remainingChars} characters remaining
                    </span>
                    <button
                      onClick={() => setMessage("")}
                      disabled={sending}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Islamic Etiquette */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                        Adab of Connection (Islamic Etiquette)
                      </h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• Begin with &quot;Assalamu alaikum&quot; (Peace be upon you)</li>
                        <li>• Be sincere in your intentions</li>
                        <li>• Maintain respectful boundaries</li>
                        <li>• Seek righteous companionship</li>
                        <li>• May Allah bless your connection</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={sending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending || !message.trim() || message.length > maxLength}
                    className="flex-[2] bg-primary-600 hover:bg-primary-700"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send with Bismillah
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

