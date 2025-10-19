"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanionStats, CompanionConnection, CompanionNotification } from "@/types/companion";

export function useCompanionData() {
  const [stats, setStats] = useState<CompanionStats>({
    total_connections: 0,
    pending_requests: 0,
    active_partnerships: 0,
    total_interactions: 0,
    average_connection_strength: 0,
    is_mentor: false,
    is_mentee: false,
  });
  const [pendingConnections, setPendingConnections] = useState<CompanionConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadCompanionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get pending connection requests (where user is recipient)
      const { data: pending } = await supabase
        .from('companion_connections')
        .select(`
          *,
          requester:profiles!companion_connections_requester_id_fkey(
            id, username, full_name, avatar_url, bio, interests, beneficial_count
          )
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingConnections(pending || []);

      // Get stats
      const { data: connections } = await supabase
        .from('companion_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const { data: partnerships } = await supabase
        .from('study_partnerships')
        .select('*')
        .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
        .eq('is_active', true);

      const { data: interactions } = await supabase
        .from('companion_interactions')
        .select('id, companion_connection_id')
        .in('companion_connection_id', connections?.map(c => c.id) || []);

      const { data: mentorships } = await supabase
        .from('mentor_relationships')
        .select('*')
        .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
        .eq('status', 'active');

      const avgStrength = connections && connections.length > 0
        ? connections.reduce((sum, c) => sum + c.connection_strength, 0) / connections.length
        : 0;

      setStats({
        total_connections: connections?.length || 0,
        pending_requests: pending?.length || 0,
        active_partnerships: partnerships?.length || 0,
        total_interactions: interactions?.length || 0,
        average_connection_strength: Math.round(avgStrength),
        is_mentor: mentorships?.some(m => m.mentor_id === user.id) || false,
        is_mentee: mentorships?.some(m => m.student_id === user.id) || false,
      });
    } catch (error) {
      console.error('Error loading companion data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanionData();

    // Set up real-time subscription for pending requests
    const subscription = supabase
      .channel('companion_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companion_connections',
        },
        () => {
          loadCompanionData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    stats,
    pendingConnections,
    loading,
    refresh: loadCompanionData,
  };
}

