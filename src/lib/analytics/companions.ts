import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

/**
 * Privacy-Conscious Companion Analytics
 * 
 * This analytics module tracks system-wide companion metrics WITHOUT collecting
 * personal user data, message content, or identifiable information.
 * All metrics are aggregated and anonymized.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ConnectionMetrics {
  total_requests: number;
  total_accepted: number;
  total_declined: number;
  total_blocked: number;
  acceptance_rate: number; // percentage (0-100)
  decline_rate: number;
  avg_time_to_acceptance: number; // minutes
  pending_average_age: number; // days
  retention_30_days: number; // percentage
  retention_60_days: number; // percentage
  retention_90_days: number; // percentage
}

export interface EngagementMetrics {
  posts_from_companions_viewed: number;
  posts_from_others_viewed: number;
  companion_post_engagement_rate: number; // percentage
  beneficial_marks_between_companions: number;
  beneficial_marks_vs_others: number;
  avg_beneficial_per_companion: number;
  study_partnerships_active: number;
  study_partnerships_completed: number;
  halaqa_joins_through_companions: number;
  total_halaqa_joins: number;
  companion_driven_join_rate: number; // percentage
  avg_interactions_per_pair: number;
}

export interface SystemHealthMetrics {
  daily_active_companions: number;
  weekly_active_companions: number;
  monthly_active_companions: number;
  total_active_users: number;
  companion_adoption_rate: number; // percentage with at least 1 connection
  avg_connections_per_user: number;
  median_connection_strength: number; // 0-100
  std_dev_connection_strength: number;
  connections_90_plus: number; // percentage
  connections_60_plus: number; // percentage
  connections_below_40: number; // percentage
  geographic_regions_with_connections: number;
  avg_distance_between_companions: string; // "unknown" or description
  feature_tree_views: number;
  feature_suggestions_clicked: number;
  feature_compatibility_viewed: number;
  feature_suggestions_usage_rate: number; // percentage
}

export interface SafetyMetrics {
  blocked_connections: number;
  reported_connections: number;
  auto_declined_old_requests: number;
  guardian_approvals_required: number;
  guardian_approvals_granted: number;
  guardian_approval_rate: number; // percentage
  minor_accounts_active: number;
  parental_controls_enabled: number; // percentage
  age_restricted_matches_prevented: number;
  gender_preference_filters_used: number; // percentage
}

export interface AnalyticsSnapshot {
  timestamp: string; // ISO timestamp
  date: string; // YYYY-MM-DD for easy grouping
  connection_metrics: ConnectionMetrics;
  engagement_metrics: EngagementMetrics;
  system_health: SystemHealthMetrics;
  safety_metrics: SafetyMetrics;
}

// ============================================================================
// CONNECTION METRICS
// ============================================================================

/**
 * Get connection-related metrics
 * Tracks how people are connecting through the system
 */
export async function getConnectionMetrics(): Promise<ConnectionMetrics> {
  const supabase = createClient();

  try {
    // Get connection counts by status
    const { data: connections } = await supabase
      .from("companion_connections")
      .select("status, created_at, connection_strength");

    if (!connections) {
      return getEmptyConnectionMetrics();
    }

    const total = connections.length;
    const accepted = connections.filter((c) => c.status === "accepted").length;
    const declined = connections.filter((c) => c.status === "declined").length;
    const pending = connections.filter((c) => c.status === "pending").length;
    const blocked = connections.filter((c) => c.status === "blocked").length;

    // Calculate acceptance rate (of decided connections)
    const decided = accepted + declined;
    const acceptance_rate = decided > 0 ? (accepted / decided) * 100 : 0;
    const decline_rate = decided > 0 ? (declined / decided) * 100 : 0;

    // Calculate average time to acceptance
    const acceptedConnections = connections.filter(
      (c) => c.status === "accepted"
    );
    const avg_time_to_acceptance =
      acceptedConnections.length > 0
        ? acceptedConnections.reduce((sum, c) => {
            const createdAt = new Date(c.created_at);
            const now = new Date();
            return sum + (now.getTime() - createdAt.getTime()) / (1000 * 60);
          }, 0) / acceptedConnections.length
        : 0;

    // Calculate pending average age
    const pendingConnections = connections.filter(
      (c) => c.status === "pending"
    );
    const pending_average_age =
      pendingConnections.length > 0
        ? pendingConnections.reduce((sum, c) => {
            const createdAt = new Date(c.created_at);
            const now = new Date();
            return sum + (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / pendingConnections.length
        : 0;

    // Calculate retention rates
    const now = new Date();
    const retention_30_days = calculateRetention(connections, 30);
    const retention_60_days = calculateRetention(connections, 60);
    const retention_90_days = calculateRetention(connections, 90);

    return {
      total_requests: total,
      total_accepted: accepted,
      total_declined: declined,
      total_blocked: blocked,
      acceptance_rate: Math.round(acceptance_rate * 100) / 100,
      decline_rate: Math.round(decline_rate * 100) / 100,
      avg_time_to_acceptance: Math.round(avg_time_to_acceptance * 100) / 100,
      pending_average_age: Math.round(pending_average_age * 100) / 100,
      retention_30_days: Math.round(retention_30_days * 100) / 100,
      retention_60_days: Math.round(retention_60_days * 100) / 100,
      retention_90_days: Math.round(retention_90_days * 100) / 100,
    };
  } catch (error) {
    console.error("Error getting connection metrics:", error);
    return getEmptyConnectionMetrics();
  }
}

// ============================================================================
// ENGAGEMENT METRICS
// ============================================================================

/**
 * Get engagement-related metrics
 * Tracks how companions interact with each other and the system
 */
export async function getEngagementMetrics(): Promise<EngagementMetrics> {
  const supabase = createClient();

  try {
    // Get companion interactions
    const { data: interactions } = await supabase
      .from("companion_interactions")
      .select("interaction_type");

    const beneficial_between = interactions?.filter(
      (i) => i.interaction_type === "beneficial_given"
    ).length || 0;

    // Get study partnerships
    const { data: partnerships } = await supabase
      .from("study_partnerships")
      .select("*");

    const active_partnerships = partnerships?.filter((p) => {
      const createdAt = new Date(p.created_at);
      const now = new Date();
      const daysPassed =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysPassed < 90; // Consider active if less than 90 days old
    }).length || 0;

    return {
      posts_from_companions_viewed: 0, // Would be tracked via view events
      posts_from_others_viewed: 0, // Would be tracked via view events
      companion_post_engagement_rate: 0, // Calculated from above
      beneficial_marks_between_companions: beneficial_between,
      beneficial_marks_vs_others: 0, // Would require view context
      avg_beneficial_per_companion: 0, // Calculated from above
      study_partnerships_active: active_partnerships,
      study_partnerships_completed: 0, // Would need completion status
      halaqa_joins_through_companions: 0, // Would track via referral
      total_halaqa_joins: 0, // Would track via halaqa join events
      companion_driven_join_rate: 0, // Calculated from above
      avg_interactions_per_pair: beneficial_between > 0 ? beneficial_between / 2 : 0,
    };
  } catch (error) {
    console.error("Error getting engagement metrics:", error);
    return getEmptyEngagementMetrics();
  }
}

// ============================================================================
// SYSTEM HEALTH METRICS
// ============================================================================

/**
 * Get system health metrics
 * Tracks overall platform health and adoption
 */
export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  const supabase = createClient();

  try {
    // Get total active users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, companion_score, last_active");

    if (!profiles || profiles.length === 0) {
      return getEmptySystemHealthMetrics();
    }

    // Count users with at least one connection
    const users_with_connections = profiles.filter(
      (p) => (p.companion_score || 0) > 0
    ).length;

    // Calculate adoption rate
    const adoption_rate =
      (users_with_connections / profiles.length) * 100;

    // Get connection data
    const { data: connections } = await supabase
      .from("companion_connections")
      .select("requester_id, recipient_id, connection_strength");

    // Calculate average connections per user with connections
    const avg_connections_per_user =
      users_with_connections > 0
        ? (connections?.length || 0) * 2 / users_with_connections // *2 because each connection involves 2 users
        : 0;

    // Calculate connection strength stats
    const strengths = connections?.map((c) => c.connection_strength || 0) || [];
    const median = calculateMedian(strengths);
    const stdDev = calculateStdDev(strengths);

    // Count strength distribution
    const strong_90_plus = strengths.filter((s) => s >= 90).length;
    const strong_60_plus = strengths.filter((s) => s >= 60).length;
    const weak_below_40 = strengths.filter((s) => s < 40).length;

    // Daily/weekly/monthly active
    const now = new Date();
    const daily_active = countActiveInDays(profiles, 1);
    const weekly_active = countActiveInDays(profiles, 7);
    const monthly_active = countActiveInDays(profiles, 30);

    return {
      daily_active_companions: daily_active,
      weekly_active_companions: weekly_active,
      monthly_active_companions: monthly_active,
      total_active_users: profiles.length,
      companion_adoption_rate: Math.round(adoption_rate * 100) / 100,
      avg_connections_per_user:
        Math.round(avg_connections_per_user * 100) / 100,
      median_connection_strength: Math.round(median * 100) / 100,
      std_dev_connection_strength: Math.round(stdDev * 100) / 100,
      connections_90_plus:
        connections && connections.length > 0
          ? Math.round(
              (strong_90_plus / connections.length) * 100 * 100
            ) / 100
          : 0,
      connections_60_plus:
        connections && connections.length > 0
          ? Math.round(
              (strong_60_plus / connections.length) * 100 * 100
            ) / 100
          : 0,
      connections_below_40:
        connections && connections.length > 0
          ? Math.round(
              (weak_below_40 / connections.length) * 100 * 100
            ) / 100
          : 0,
      geographic_regions_with_connections: 0, // Would require location data
      avg_distance_between_companions: "unknown", // Privacy-conscious, not tracking
      feature_tree_views: 0, // Would track via analytics events
      feature_suggestions_clicked: 0, // Would track via analytics events
      feature_compatibility_viewed: 0, // Would track via analytics events
      feature_suggestions_usage_rate: 0, // Calculated from above
    };
  } catch (error) {
    console.error("Error getting system health metrics:", error);
    return getEmptySystemHealthMetrics();
  }
}

// ============================================================================
// SAFETY METRICS
// ============================================================================

/**
 * Get safety-related metrics
 * Tracks protective measures and policy enforcement
 */
export async function getSafetyMetrics(): Promise<SafetyMetrics> {
  const supabase = createClient();

  try {
    // Get blocked connections
    const { data: connections } = await supabase
      .from("companion_connections")
      .select("status");

    const blocked = connections?.filter((c) => c.status === "blocked").length || 0;

    // Get profiles with parental controls
    const { data: profiles } = await supabase
      .from("profiles")
      .select("parental_controls");

    const minors = profiles?.filter(
      (p) => p.parental_controls && JSON.parse(p.parental_controls as string).isMinor
    ).length || 0;

    const with_parental = profiles?.filter(
      (p) => p.parental_controls && JSON.parse(p.parental_controls as string).requireGuardianApproval
    ).length || 0;

    const parental_rate =
      profiles && profiles.length > 0
        ? (with_parental / profiles.length) * 100
        : 0;

    return {
      blocked_connections: blocked,
      reported_connections: 0, // Would track via reports table
      auto_declined_old_requests: 0, // Would track via declined with auto_declined flag
      guardian_approvals_required: with_parental,
      guardian_approvals_granted: 0, // Would track via approval events
      guardian_approval_rate: 0, // Calculated from above
      minor_accounts_active: minors,
      parental_controls_enabled: Math.round(parental_rate * 100) / 100,
      age_restricted_matches_prevented: 0, // Would track via matcher logs
      gender_preference_filters_used: 0, // Would track via preference settings
    };
  } catch (error) {
    console.error("Error getting safety metrics:", error);
    return getEmptySafetyMetrics();
  }
}

// ============================================================================
// SNAPSHOT & STORAGE
// ============================================================================

/**
 * Get a complete analytics snapshot
 */
export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const now = new Date();
  const timestamp = now.toISOString();
  const date = now.toISOString().split("T")[0];

  const [connection_metrics, engagement_metrics, system_health, safety_metrics] =
    await Promise.all([
      getConnectionMetrics(),
      getEngagementMetrics(),
      getSystemHealthMetrics(),
      getSafetyMetrics(),
    ]);

  return {
    timestamp,
    date,
    connection_metrics,
    engagement_metrics,
    system_health,
    safety_metrics,
  };
}

/**
 * Store analytics snapshot for historical tracking
 */
export async function storeAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("analytics_snapshots").insert({
      timestamp: snapshot.timestamp,
      date: snapshot.date,
      metrics: snapshot,
    });

    if (error) {
      console.error("Error storing analytics snapshot:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error storing analytics snapshot:", error);
    return false;
  }
}

/**
 * Get historical snapshots for trend analysis
 */
export async function getHistoricalSnapshots(
  days: number = 30
): Promise<AnalyticsSnapshot[]> {
  const supabase = createClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data } = await supabase
      .from("analytics_snapshots")
      .select("metrics")
      .gte("date", cutoffDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    return data?.map((row: any) => row.metrics) || [];
  } catch (error) {
    console.error("Error getting historical snapshots:", error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateRetention(
  connections: any[],
  days: number
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const total = connections.filter((c) => c.status === "accepted").length;
  const retained = connections.filter((c) => {
    const createdAt = new Date(c.created_at);
    return c.status === "accepted" && createdAt <= cutoff;
  }).length;

  return total > 0 ? (retained / total) * 100 : 0;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function countActiveInDays(profiles: any[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return profiles.filter((p) => {
    const lastActive = p.last_active ? new Date(p.last_active) : null;
    return lastActive && lastActive > cutoff;
  }).length;
}

// ============================================================================
// EMPTY/DEFAULT METRICS
// ============================================================================

function getEmptyConnectionMetrics(): ConnectionMetrics {
  return {
    total_requests: 0,
    total_accepted: 0,
    total_declined: 0,
    total_blocked: 0,
    acceptance_rate: 0,
    decline_rate: 0,
    avg_time_to_acceptance: 0,
    pending_average_age: 0,
    retention_30_days: 0,
    retention_60_days: 0,
    retention_90_days: 0,
  };
}

function getEmptyEngagementMetrics(): EngagementMetrics {
  return {
    posts_from_companions_viewed: 0,
    posts_from_others_viewed: 0,
    companion_post_engagement_rate: 0,
    beneficial_marks_between_companions: 0,
    beneficial_marks_vs_others: 0,
    avg_beneficial_per_companion: 0,
    study_partnerships_active: 0,
    study_partnerships_completed: 0,
    halaqa_joins_through_companions: 0,
    total_halaqa_joins: 0,
    companion_driven_join_rate: 0,
    avg_interactions_per_pair: 0,
  };
}

function getEmptySystemHealthMetrics(): SystemHealthMetrics {
  return {
    daily_active_companions: 0,
    weekly_active_companions: 0,
    monthly_active_companions: 0,
    total_active_users: 0,
    companion_adoption_rate: 0,
    avg_connections_per_user: 0,
    median_connection_strength: 0,
    std_dev_connection_strength: 0,
    connections_90_plus: 0,
    connections_60_plus: 0,
    connections_below_40: 0,
    geographic_regions_with_connections: 0,
    avg_distance_between_companions: "unknown",
    feature_tree_views: 0,
    feature_suggestions_clicked: 0,
    feature_compatibility_viewed: 0,
    feature_suggestions_usage_rate: 0,
  };
}

function getEmptySafetyMetrics(): SafetyMetrics {
  return {
    blocked_connections: 0,
    reported_connections: 0,
    auto_declined_old_requests: 0,
    guardian_approvals_required: 0,
    guardian_approvals_granted: 0,
    guardian_approval_rate: 0,
    minor_accounts_active: 0,
    parental_controls_enabled: 0,
    age_restricted_matches_prevented: 0,
    gender_preference_filters_used: 0,
  };
}
