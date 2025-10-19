"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Users,
  FolderPlus,
  Bell,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PendingConnection {
  id: string;
  requester: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    interests: string[];
    beneficial_count: number;
  };
  message: string | null;
  created_at: string;
}

interface CompanionManagementProps {
  pendingConnections: PendingConnection[];
  onRefresh: () => void;
}

export function CompanionManagement({ pendingConnections, onRefresh }: CompanionManagementProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAcceptConnection = async (connectionId: string) => {
    setProcessing(connectionId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("companion_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;

      toast.success("Connection accepted! 🎉");
      onRefresh();
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    setProcessing(connectionId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("companion_connections")
        .update({ status: "declined" })
        .eq("id", connectionId);

      if (error) throw error;

      toast.success("Connection declined");
      onRefresh();
    } catch (error) {
      console.error("Error declining connection:", error);
      toast.error("Failed to decline connection");
    } finally {
      setProcessing(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Pending Salam Requests */}
      {pendingConnections.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Pending Salam Requests
                <Badge variant="default" className="ml-2">
                  {pendingConnections.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {pendingConnections.map((connection, index) => (
                  <motion.div
                    key={connection.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={connection.requester.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                          {getInitials(connection.requester.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {connection.requester.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              @{connection.requester.username}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(connection.created_at)}
                          </span>
                        </div>

                        {connection.message && (
                          <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-md border border-primary-200 dark:border-primary-800">
                            <p className="text-sm text-foreground italic">
                              &quot;{connection.message}&quot;
                            </p>
                          </div>
                        )}

                        {connection.requester.bio && (
                          <p className="text-sm text-foreground-secondary mb-2 line-clamp-2">
                            {connection.requester.bio}
                          </p>
                        )}

                        {/* Interests */}
                        {connection.requester.interests && connection.requester.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {connection.requester.interests.slice(0, 4).map((interest) => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptConnection(connection.id)}
                            disabled={processing === connection.id}
                            className="bg-success-600 hover:bg-success-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {processing === connection.id ? "Processing..." : "Accept"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineConnection(connection.id)}
                            disabled={processing === connection.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button size="sm" variant="ghost">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Companion Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Send New Salam */}
            <button
              onClick={() => window.location.href = '/tools/companions'}
              className="p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5 text-primary-600" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Send Salam</h4>
              <p className="text-xs text-muted-foreground">
                Connect with new companions
              </p>
            </button>

            {/* Organize Groups */}
            <button
              onClick={() => toast.info("Groups feature coming soon!")}
              className="p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FolderPlus className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Groups</h4>
              <p className="text-xs text-muted-foreground">
                Organize your companions
              </p>
            </button>

            {/* Notification Settings */}
            <button
              className="p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
              onClick={() => setShowSettings(true)}
            >
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Notifications</h4>
              <p className="text-xs text-muted-foreground">
                Manage your alerts
              </p>
            </button>

            {/* Privacy Settings */}
            <button
              onClick={() => toast.info("Privacy settings coming soon!")}
              className="p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Privacy</h4>
              <p className="text-xs text-muted-foreground">
                Control who can connect
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Settings Modal (placeholder) */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">New Connection Requests</p>
                  <p className="text-sm text-muted-foreground">Get notified about new Salams</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Companion Activity</p>
                  <p className="text-sm text-muted-foreground">Updates from your companions</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Study Group Invites</p>
                  <p className="text-sm text-muted-foreground">Invitations to study together</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setShowSettings(false)} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

