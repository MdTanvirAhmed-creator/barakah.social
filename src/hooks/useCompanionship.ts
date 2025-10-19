"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface CompanionConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  connection_strength: number;
  message?: string;
  created_at: string;
  updated_at?: string;
  last_interaction?: string;
}

export interface CompanionshipState {
  connections: CompanionConnection[];
  pendingRequests: CompanionConnection[];
  acceptedConnections: CompanionConnection[];
  sentRequests: CompanionConnection[];
  loading: boolean;
  error: string | null;
}

/**
 * useCompanionship - Hook for managing companion connections
 * 
 * Features:
 * - Fetch all connections
 * - Real-time updates
 * - Accept/decline requests
 * - Send new connections
 * - Update connection strength
 * - Feed algorithm integration
 */
export function useCompanionship() {
  const [state, setState] = useState<CompanionshipState>({
    connections: [],
    pendingRequests: [],
    acceptedConnections: [],
    sentRequests: [],
    loading: true,
    error: null,
  });

  const supabase = createClient();

  // Load all connections
  const loadConnections = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Fetch all connections for this user
      const { data, error } = await supabase
        .from("companion_connections")
        .select(`
          *,
          requester:profiles!companion_connections_requester_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            interests
          ),
          recipient:profiles!companion_connections_recipient_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            interests
          )
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Categorize connections
      const pending = data?.filter(
        (conn) => conn.status === "pending" && conn.recipient_id === user.id
      ) || [];

      const sent = data?.filter(
        (conn) => conn.status === "pending" && conn.requester_id === user.id
      ) || [];

      const accepted = data?.filter(
        (conn) => conn.status === "accepted"
      ) || [];

      setState({
        connections: data || [],
        pendingRequests: pending,
        acceptedConnections: accepted,
        sentRequests: sent,
        loading: false,
        error: null,
      });

    } catch (error: any) {
      console.error("Error loading connections:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load connections",
      }));
    }
  }, [supabase]);

  // Accept a connection request
  const acceptConnection = useCallback(async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("companion_connections")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;

      // Create welcome interaction
      await supabase
        .from("companion_interactions")
        .insert({
          companion_connection_id: connectionId,
          interaction_type: "beneficial_given",
          created_at: new Date().toISOString(),
        });

      // Reload connections
      await loadConnections();

      // Update feed algorithm weights
      await updateFeedAlgorithm(connectionId);

      toast.success("Wa Alaikum Salam! You are now companions 🤝");
      return true;

    } catch (error: any) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
      return false;
    }
  }, [supabase, loadConnections]);

  // Decline a connection request
  const declineConnection = useCallback(async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("companion_connections")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;

      // Reload connections
      await loadConnections();

      toast.info("Request declined politely");
      return true;

    } catch (error: any) {
      console.error("Error declining connection:", error);
      toast.error("Failed to decline request");
      return false;
    }
  }, [supabase, loadConnections]);

  // Send a new connection request
  const sendConnectionRequest = useCallback(async (
    recipientId: string,
    message: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to send connection requests");
        return false;
      }

      // Check for existing connection
      const { data: existing } = await supabase
        .from("companion_connections")
        .select("id, status")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === "pending") {
          toast.info("You already have a pending request with this companion");
        } else if (existing.status === "accepted") {
          toast.info("You're already connected!");
        } else if (existing.status === "declined") {
          toast.error("Previous request was declined");
        }
        return false;
      }

      // Create new connection
      const { error } = await supabase
        .from("companion_connections")
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: "pending",
          message,
          connection_strength: 50,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Reload connections
      await loadConnections();

      toast.success("Salam sent! 🤲");
      return true;

    } catch (error: any) {
      console.error("Error sending connection:", error);
      toast.error("Failed to send connection request");
      return false;
    }
  }, [supabase, loadConnections]);

  // Update connection strength
  const updateConnectionStrength = useCallback(async (
    connectionId: string,
    newStrength: number
  ) => {
    try {
      const { error } = await supabase
        .from("companion_connections")
        .update({
          connection_strength: Math.max(0, Math.min(100, newStrength)), // Clamp 0-100
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;

      await loadConnections();
      return true;

    } catch (error: any) {
      console.error("Error updating connection strength:", error);
      return false;
    }
  }, [supabase, loadConnections]);

  // Record an interaction
  const recordInteraction = useCallback(async (
    connectionId: string,
    interactionType: "beneficial_given" | "comment_reply" | "halaqa_shared" | "knowledge_shared" | "message_sent"
  ) => {
    try {
      // Create interaction record
      await supabase
        .from("companion_interactions")
        .insert({
          companion_connection_id: connectionId,
          interaction_type: interactionType,
          created_at: new Date().toISOString(),
        });

      // Get current connection
      const connection = state.connections.find((c) => c.id === connectionId);
      if (connection) {
        // Increase connection strength by 1-5 points based on interaction type
        const strengthIncrease = {
          beneficial_given: 2,
          comment_reply: 3,
          halaqa_shared: 5,
          knowledge_shared: 4,
          message_sent: 1,
        }[interactionType];

        await updateConnectionStrength(
          connectionId,
          connection.connection_strength + strengthIncrease
        );
      }

      return true;

    } catch (error: any) {
      console.error("Error recording interaction:", error);
      return false;
    }
  }, [supabase, state.connections, updateConnectionStrength]);

  // Update feed algorithm based on connections
  const updateFeedAlgorithm = useCallback(async (connectionId: string) => {
    try {
      // This would integrate with your feed algorithm
      // For now, we'll just update the last_interaction timestamp
      const { error } = await supabase
        .from("companion_connections")
        .update({
          last_interaction: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;

      // In a real implementation, you might:
      // - Update user's feed preferences
      // - Boost content from this companion
      // - Suggest similar companions
      // - Update recommendation weights

    } catch (error: any) {
      console.error("Error updating feed algorithm:", error);
    }
  }, [supabase]);

  // Get connection status (pending, sent, accepted, none)
  const getConnectionStatus = useCallback((companionId: string, userId: string): "pending" | "sent" | "accepted" | "none" => {
    const connection = state.connections.find(
      (conn) =>
        (conn.requester_id === companionId || conn.recipient_id === companionId) &&
        conn.requester_id !== companionId
    );

    if (!connection) return "none";
    if (connection.status === "accepted") return "accepted";
    
    // Check if current user sent the request
    if (connection.requester_id === userId) return "sent"; // Sent
    if (connection.recipient_id === userId) return "pending"; // Received

    return "none";
  }, [state.connections]);

  // Get connection by companion ID
  const getConnectionByCompanionId = useCallback((companionId: string): CompanionConnection | null => {
    return state.connections.find(
      (conn) =>
        (conn.requester_id === companionId || conn.recipient_id === companionId) &&
        conn.status === "accepted"
    ) || null;
  }, [state.connections]);

  // Setup real-time subscription
  useEffect(() => {
    loadConnections();

    // Subscribe to changes
    const setupSubscription = async () => {
      const { data: { user: userData } } = await supabase.auth.getUser();
      
      if (!userData) return;

      const subscription = supabase
        .channel("companion_connections")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "companion_connections",
            filter: `or(requester_id.eq.${userData.id},recipient_id.eq.${userData.id})`,
          },
          (payload) => {
            console.log("Connection update:", payload);
            loadConnections();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupSubscription();
  }, [loadConnections, supabase]);

  return {
    ...state,
    acceptConnection,
    declineConnection,
    sendConnectionRequest,
    updateConnectionStrength,
    recordInteraction,
    getConnectionStatus,
    getConnectionByCompanionId,
    refresh: loadConnections,
  };
}

