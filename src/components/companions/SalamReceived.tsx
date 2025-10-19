"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Eye,
  Heart,
  Users,
  MessageCircle,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SalamReceivedProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    requester_id: string;
    message: string;
    created_at: string;
    requester: {
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      bio?: string | null;
      interests?: string[];
      beneficial_count?: number;
      location?: string;
    };
  };
  mutualContext?: {
    mutualHalaqas?: string[];
    mutualConnections?: string[];
    sharedInterests?: string[];
  };
  onAccept?: () => void;
  onDecline?: () => void;
}

/**
 * SalamReceived - Notification component for incoming connection requests
 * 
 * Features:
 * - Shows sender's profile
 * - Displays connection message
 * - Mutual context (Halaqas, connections)
 * - Three actions: Accept, View Profile, Decline
 * - Islamic greeting response
 */
export function SalamReceived({
  isOpen,
  onClose,
  request,
  mutualContext,
  onAccept,
  onDecline,
}: SalamReceivedProps) {
  const [processing, setProcessing] = useState<"accept" | "decline" | null>(null);
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const handleAccept = async () => {
    setProcessing("accept");

    try {
      const supabase = createClient();

      // Update connection status to accepted
      const { error } = await supabase
        .from("companion_connections")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      // Create interaction record
      await supabase
        .from("companion_interactions")
        .insert({
          companion_connection_id: request.id,
          interaction_type: "beneficial_given",
          created_at: new Date().toISOString(),
        });

      // Success!
      setAccepted(true);
      toast.success("Wa Alaikum Salam! 🤝", {
        description: "You are now companions",
        action: {
          label: "View Profile",
          onClick: () => router.push(`/profile/${request.requester.username}`),
        },
      });

      setTimeout(() => {
        onAccept?.();
        onClose();
        setAccepted(false);
      }, 2500);

    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
      setProcessing(null);
    }
  };

  const handleDecline = async () => {
    setProcessing("decline");

    try {
      const supabase = createClient();

      // Update connection status to declined
      const { error } = await supabase
        .from("companion_connections")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast.info("Request declined politely", {
        description: "JazakAllah khair for your response",
      });

      setTimeout(() => {
        onDecline?.();
        onClose();
      }, 1000);

    } catch (error) {
      console.error("Error declining connection:", error);
      toast.error("Failed to decline request");
      setProcessing(null);
    }
  };

  const handleViewProfile = () => {
    router.push(`/profile/${request.requester.username}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accepted State */}
          {accepted ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-20 h-20 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-10 h-10 text-success-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Wa Alaikum Salam! 🤝
              </h3>
              <p className="text-muted-foreground mb-1">
                You and {request.requester.full_name} are now companions
              </p>
              <p className="text-sm text-muted-foreground">
                May Allah strengthen your bond
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-success-500 to-success-700 p-6 text-white z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Salam Received</h2>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={!!processing}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-success-100">
                  {request.requester.full_name} wants to connect with you
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Sender Profile */}
                <div className="mb-6">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <Avatar className="h-20 w-20 flex-shrink-0">
                      <AvatarImage src={request.requester.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xl">
                        {getInitials(request.requester.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">
                            {request.requester.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{request.requester.username}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {getTimeAgo(request.created_at)}
                        </div>
                      </div>

                      {request.requester.bio && (
                        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                          {request.requester.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {request.requester.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {request.requester.location}
                          </div>
                        )}
                        {request.requester.beneficial_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {request.requester.beneficial_count} beneficial
                          </div>
                        )}
                      </div>

                      {/* Interests */}
                      {request.requester.interests && request.requester.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {request.requester.interests.slice(0, 4).map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border-l-4 border-primary-500">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-semibold text-primary-700 dark:text-primary-400">
                      Their Message
                    </h4>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pl-7">
                    &quot;{request.message}&quot;
                  </p>
                </div>

                {/* Mutual Context */}
                {mutualContext && (
                  (mutualContext.mutualHalaqas && mutualContext.mutualHalaqas.length > 0) ||
                  (mutualContext.mutualConnections && mutualContext.mutualConnections.length > 0) ||
                  (mutualContext.sharedInterests && mutualContext.sharedInterests.length > 0)
                ) && (
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-foreground">
                        What You Have in Common
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {/* Mutual Halaqas */}
                      {mutualContext.mutualHalaqas && mutualContext.mutualHalaqas.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Users className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-foreground">
                              {mutualContext.mutualHalaqas.length} Mutual Halaqa{mutualContext.mutualHalaqas.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-5">
                            {mutualContext.mutualHalaqas.map((halaqa, idx) => (
                              <span key={idx} className="text-xs text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/20 px-2 py-1 rounded">
                                {halaqa}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mutual Connections */}
                      {mutualContext.mutualConnections && mutualContext.mutualConnections.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Users className="w-4 h-4 text-success-600" />
                            <span className="text-sm font-medium text-foreground">
                              {mutualContext.mutualConnections.length} Mutual Companion{mutualContext.mutualConnections.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-5">
                            You both know {mutualContext.mutualConnections.slice(0, 2).join(", ")}
                            {mutualContext.mutualConnections.length > 2 && ` and ${mutualContext.mutualConnections.length - 2} others`}
                          </p>
                        </div>
                      )}

                      {/* Shared Interests */}
                      {mutualContext.sharedInterests && mutualContext.sharedInterests.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            <Heart className="w-4 h-4 text-error" />
                            <span className="text-sm font-medium text-foreground">
                              {mutualContext.sharedInterests.length} Shared Interest{mutualContext.sharedInterests.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-5">
                            {mutualContext.sharedInterests.map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {/* Accept */}
                  <Button
                    onClick={handleAccept}
                    disabled={!!processing}
                    className="w-full bg-success-600 hover:bg-success-700 text-white py-6"
                  >
                    {processing === "accept" ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Wa Alaikum Salam (Accept)
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    {/* View Profile */}
                    <Button
                      onClick={handleViewProfile}
                      disabled={!!processing}
                      variant="outline"
                      className="py-6"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Profile
                    </Button>

                    {/* Decline */}
                    <Button
                      onClick={handleDecline}
                      disabled={!!processing}
                      variant="outline"
                      className="py-6 border-error/50 text-error hover:bg-error/10"
                    >
                      {processing === "decline" ? (
                        "Declining..."
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Not now, JazakAllah
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Islamic Note */}
                <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                    &quot;The best companion is one who reminds you of Allah&quot; - Take your time to decide
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

