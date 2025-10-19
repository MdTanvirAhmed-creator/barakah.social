"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, X, Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import type { CompanionConnection } from "@/types/companion";
import Link from "next/link";

interface CompanionNotificationDropdownProps {
  pendingConnections: CompanionConnection[];
  onUpdate: () => void;
}

export function CompanionNotificationDropdown({
  pendingConnections,
  onUpdate,
}: CompanionNotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { success, error: showError } = useToast();
  const supabase = createClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAccept = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('companion_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      success("Connection request accepted!");
      onUpdate();
    } catch (err) {
      console.error('Error accepting connection:', err);
      showError("Failed to accept connection");
    }
  };

  const handleDecline = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('companion_connections')
        .update({ status: 'declined' })
        .eq('id', connectionId);

      if (error) throw error;

      success("Connection request declined");
      onUpdate();
    } catch (err) {
      console.error('Error declining connection:', err);
      showError("Failed to decline connection");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingCount = pendingConnections.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Users className="w-5 h-5 text-muted-foreground" />
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-2 top-full mt-2 w-80 md:w-96 max-w-[calc(100vw-320px)] bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Companion Requests</h3>
                {pendingCount > 0 && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {pendingCount === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No pending connection requests
                  </p>
                  <Link href="/companions/discover">
                    <Button variant="outline" size="sm" className="mt-4">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Discover Companions
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={connection.requester?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary-100 text-primary-700">
                            {getInitials(connection.requester?.full_name || 'Unknown')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {connection.requester?.full_name}
                            </p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(connection.created_at)}
                            </span>
                          </div>
                          
                          {connection.message && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {connection.message}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(connection.id)}
                              className="flex-1 bg-primary-600 hover:bg-primary-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(connection.id)}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {pendingCount > 0 && (
              <div className="p-3 border-t border-border bg-muted/30">
                <Link href="/companions">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View All Companions
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

