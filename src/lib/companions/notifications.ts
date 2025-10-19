/**
 * Companion-Aware Notification System
 * 
 * Manages notifications related to companion activities:
 * - Companion posted new content
 * - Companion joined your Halaqa
 * - Weekly companion activity digest
 * - Companion interaction alerts
 */

import { createClient } from "@/lib/supabase/client";

export type CompanionNotificationType =
  | "companion_new_post"
  | "companion_joined_halaqa"
  | "companion_weekly_digest"
  | "companion_beneficial_mark"
  | "companion_comment"
  | "companion_study_invitation"
  | "companion_milestone";

export interface CompanionNotificationPreferences {
  user_id: string;
  companion_new_post: boolean;
  companion_joined_halaqa: boolean;
  companion_weekly_digest: boolean;
  companion_beneficial_mark: boolean;
  companion_comment: boolean;
  companion_study_invitation: boolean;
  companion_milestone: boolean;
  digest_day: "monday" | "friday" | "sunday";
  digest_time: string; // "09:00" format
  enabled: boolean;
}

export interface CompanionNotification {
  id: string;
  user_id: string;
  type: CompanionNotificationType;
  title: string;
  message: string;
  companion_id: string;
  companion_name: string;
  companion_avatar_url: string | null;
  link?: string;
  read: boolean;
  created_at: string;
}

/**
 * Get user's companion notification preferences
 */
export async function getCompanionNotificationPreferences(
  userId: string
): Promise<CompanionNotificationPreferences> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("companion_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return default preferences
    return {
      user_id: userId,
      companion_new_post: true,
      companion_joined_halaqa: true,
      companion_weekly_digest: true,
      companion_beneficial_mark: true,
      companion_comment: true,
      companion_study_invitation: true,
      companion_milestone: true,
      digest_day: "friday",
      digest_time: "09:00",
      enabled: true,
    };
  }

  return data as CompanionNotificationPreferences;
}

/**
 * Update companion notification preferences
 */
export async function updateCompanionNotificationPreferences(
  userId: string,
  preferences: Partial<CompanionNotificationPreferences>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("companion_notification_preferences")
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

  return !error;
}

/**
 * Create a companion notification
 */
export async function createCompanionNotification(
  userId: string,
  type: CompanionNotificationType,
  companionId: string,
  metadata: {
    title: string;
    message: string;
    link?: string;
  }
): Promise<boolean> {
  const supabase = createClient();

  // Check if user has this notification type enabled
  const prefs = await getCompanionNotificationPreferences(userId);
  if (!prefs.enabled || !prefs[type as keyof CompanionNotificationPreferences]) {
    return false; // User has disabled this notification type
  }

  // Get companion details
  const { data: companion } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", companionId)
    .single();

  if (!companion) return false;

  // Create notification
  const { error } = await supabase
    .from("companion_notifications")
    .insert({
      user_id: userId,
      type,
      title: metadata.title,
      message: metadata.message,
      companion_id: companionId,
      companion_name: companion.full_name,
      companion_avatar_url: companion.avatar_url,
      link: metadata.link,
      read: false,
      created_at: new Date().toISOString(),
    });

  return !error;
}

/**
 * Get recent companion notifications
 */
export async function getCompanionNotifications(
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<CompanionNotification[]> {
  const supabase = createClient();

  let query = supabase
    .from("companion_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data as CompanionNotification[];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("companion_notifications")
    .update({ read: true })
    .eq("id", notificationId);

  return !error;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("companion_notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  return !error;
}

/**
 * Generate weekly companion activity digest
 */
export async function generateWeeklyDigest(userId: string): Promise<{
  totalInteractions: number;
  newPosts: number;
  newHalaqaJoins: number;
  topCompanion: { name: string; interactions: number } | null;
  highlights: string[];
}> {
  const supabase = createClient();

  // Get date range for last week
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Get user's companions
  const { data: connections } = await supabase
    .from("companion_connections")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq("status", "accepted");

  if (!connections) {
    return {
      totalInteractions: 0,
      newPosts: 0,
      newHalaqaJoins: 0,
      topCompanion: null,
      highlights: [],
    };
  }

  const companionIds = connections.map(c =>
    c.requester_id === userId ? c.recipient_id : c.requester_id
  );

  if (companionIds.length === 0) {
    return {
      totalInteractions: 0,
      newPosts: 0,
      newHalaqaJoins: 0,
      topCompanion: null,
      highlights: [],
    };
  }

  // Count new posts from companions
  const { data: newPosts } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("author_id", companionIds)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  // Count new Halaqa joins
  const { data: newHalaqaJoins } = await supabase
    .from("halaqa_members")
    .select("id", { count: "exact", head: true })
    .in("user_id", companionIds)
    .gte("joined_at", startDate.toISOString())
    .lte("joined_at", endDate.toISOString());

  // Get interaction counts per companion
  const interactionCounts = new Map<string, number>();
  
  for (const companionId of companionIds.slice(0, 10)) { // Limit to avoid slow queries
    const { data: beneficial } = await supabase
      .from("beneficial_marks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", companionId)
      .gte("created_at", startDate.toISOString());

    const { data: comments } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", companionId)
      .gte("created_at", startDate.toISOString());

    const count = ((beneficial as any)?.count || 0) + ((comments as any)?.count || 0);
    if (count > 0) {
      interactionCounts.set(companionId, count);
    }
  }

  // Find top companion
  let topCompanion: { name: string; interactions: number } | null = null;
  if (interactionCounts.size > 0) {
    const topCompanionId = Array.from(interactionCounts.entries())
      .sort(([, a], [, b]) => b - a)[0][0];
    
    const { data: companion } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", topCompanionId)
      .single();

    if (companion) {
      topCompanion = {
        name: companion.full_name,
        interactions: interactionCounts.get(topCompanionId) || 0,
      };
    }
  }

  // Generate highlights
  const highlights: string[] = [];
  const totalInteractions = Array.from(interactionCounts.values()).reduce((sum, count) => sum + count, 0);

  if ((newPosts as any)?.count > 0) {
    highlights.push(`${(newPosts as any).count} new post${(newPosts as any).count > 1 ? 's' : ''} from your companions`);
  }
  if ((newHalaqaJoins as any)?.count > 0) {
    highlights.push(`${(newHalaqaJoins as any).count} companion${(newHalaqaJoins as any).count > 1 ? 's' : ''} joined new Halaqas`);
  }
  if (topCompanion) {
    highlights.push(`${topCompanion.name} was most active with ${topCompanion.interactions} interactions`);
  }

  return {
    totalInteractions,
    newPosts: (newPosts as any)?.count || 0,
    newHalaqaJoins: (newHalaqaJoins as any)?.count || 0,
    topCompanion,
    highlights,
  };
}

/**
 * Notify when companion posts new content
 */
export async function notifyCompanionNewPost(
  authorId: string,
  postId: string,
  postContent: string
): Promise<void> {
  const supabase = createClient();

  // Get author's companions
  const { data: connections } = await supabase
    .from("companion_connections")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${authorId},recipient_id.eq.${authorId}`)
    .eq("status", "accepted");

  if (!connections) return;

  const companionIds = connections.map(c =>
    c.requester_id === authorId ? c.recipient_id : c.requester_id
  );

  // Create notification for each companion
  for (const companionId of companionIds) {
    await createCompanionNotification(
      companionId,
      "companion_new_post",
      authorId,
      {
        title: "Companion posted new content",
        message: postContent.substring(0, 100) + (postContent.length > 100 ? "..." : ""),
        link: `/posts/${postId}`,
      }
    );
  }
}

/**
 * Notify when companion joins a Halaqa
 */
export async function notifyCompanionJoinedHalaqa(
  userId: string,
  halaqaId: string,
  halaqaName: string
): Promise<void> {
  const supabase = createClient();

  // Get user's companions
  const { data: connections } = await supabase
    .from("companion_connections")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq("status", "accepted");

  if (!connections) return;

  const companionIds = connections.map(c =>
    c.requester_id === userId ? c.recipient_id : c.requester_id
  );

  // Create notification for each companion
  for (const companionId of companionIds) {
    await createCompanionNotification(
      companionId,
      "companion_joined_halaqa",
      userId,
      {
        title: "Companion joined a Halaqa",
        message: `Joined "${halaqaName}"`,
        link: `/halaqas/${halaqaId}`,
      }
    );
  }
}

