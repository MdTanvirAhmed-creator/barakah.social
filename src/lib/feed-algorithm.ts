/**
 * Feed Algorithm - Companion-Aware Content Ranking
 * 
 * This algorithm powers the "For You" feed by ranking content based on:
 * - User preferences and behavior
 * - Companion interactions and relationships
 * - Content quality signals
 * - Recency and engagement
 */

import { createClient } from "@/lib/supabase/client";

export interface FeedPost {
  id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  beneficial_count: number;
  comment_count: number;
  is_pinned: boolean;
  halaqa_id?: string;
  halaqa_name?: string;
}

export interface ScoredPost extends FeedPost {
  score: number;
  boostReasons: string[];
  companionInteraction?: {
    companionName: string;
    action: 'liked' | 'commented' | 'shared';
  };
}

interface CompanionConnection {
  id: string;
  username: string;
  full_name: string;
}

interface FeedAlgorithmOptions {
  userId: string;
  limit?: number;
  includeCompanionOfCompanion?: boolean;
  timeDecayHours?: number;
}

/**
 * Main feed algorithm that ranks posts with companion awareness
 */
export async function getForYouFeed(options: FeedAlgorithmOptions): Promise<ScoredPost[]> {
  const {
    userId,
    limit = 50,
    includeCompanionOfCompanion = true,
    timeDecayHours = 168, // 1 week default
  } = options;

  const supabase = createClient();

  try {
    // 1. Get user's companions
    const companions = await getUserCompanions(userId);
    const companionIds = companions.map(c => c.id);

    // 2. Get companion-of-companion (2nd degree connections)
    let secondDegreeIds: string[] = [];
    if (includeCompanionOfCompanion && companionIds.length > 0) {
      secondDegreeIds = await getCompanionOfCompanions(companionIds, userId);
    }

    // 3. Fetch recent posts
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - timeDecayHours);

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        author_id,
        content,
        created_at,
        beneficial_count,
        comment_count,
        is_pinned,
        halaqa_id,
        author:profiles!posts_author_id_fkey(username, full_name, avatar_url),
        halaqa:halaqas(name)
      `)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(200); // Fetch more to allow ranking

    if (error) throw error;

    // 4. Get companion interactions with these posts
    const companionInteractions = await getCompanionInteractions(
      posts?.map(p => p.id) || [],
      companionIds
    );

    // 5. Score and rank each post
    const scoredPosts: ScoredPost[] = (posts || []).map(post => {
      const author = post.author as any;
      const halaqa = post.halaqa as any;
      
      return scorePost({
        id: post.id,
        author_id: post.author_id,
        author_username: author?.username || 'unknown',
        author_full_name: author?.full_name || 'Unknown User',
        author_avatar_url: author?.avatar_url || null,
        content: post.content,
        created_at: post.created_at,
        beneficial_count: post.beneficial_count || 0,
        comment_count: post.comment_count || 0,
        is_pinned: post.is_pinned || false,
        halaqa_id: post.halaqa_id,
        halaqa_name: halaqa?.name,
      }, {
        userId,
        companionIds,
        secondDegreeIds,
        companionInteractions,
        companions,
      });
    });

    // 6. Sort by score and return top posts
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error("Error in feed algorithm:", error);
    return [];
  }
}

/**
 * Score an individual post based on various signals
 */
function scorePost(
  post: FeedPost,
  context: {
    userId: string;
    companionIds: string[];
    secondDegreeIds: string[];
    companionInteractions: Map<string, { companionId: string; action: string }[]>;
    companions: CompanionConnection[];
  }
): ScoredPost {
  let score = 0;
  const boostReasons: string[] = [];
  let companionInteraction: ScoredPost['companionInteraction'] | undefined;

  // Base score from engagement (0-50 points)
  const engagementScore = Math.min(
    (post.beneficial_count * 2) + (post.comment_count * 3),
    50
  );
  score += engagementScore;

  // Recency score (0-30 points, decays over time)
  const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 30 - (hoursOld / 24) * 5); // Lose 5 points per day
  score += recencyScore;

  // Quality indicators (0-20 points)
  if (post.content.length > 100 && post.content.length < 1000) {
    score += 10;
    boostReasons.push("Well-formatted content");
  }
  if (post.is_pinned) {
    score += 10;
    boostReasons.push("Pinned by moderator");
  }

  // 🌟 COMPANION BOOST (1.5x multiplier + bonus points)
  if (context.companionIds.includes(post.author_id)) {
    score *= 1.5; // 50% boost for companion content
    boostReasons.push("Posted by your companion");
    
    const companion = context.companions.find(c => c.id === post.author_id);
    if (companion) {
      companionInteraction = {
        companionName: companion.full_name,
        action: 'liked', // Default, will be updated if specific interaction found
      };
    }
  }

  // 🔗 COMPANION INTERACTION BOOST (additional 20-40 points)
  const interactions = context.companionInteractions.get(post.id);
  if (interactions && interactions.length > 0) {
    const interactionBonus = Math.min(interactions.length * 20, 40);
    score += interactionBonus;
    
    const companion = context.companions.find(c => c.id === interactions[0].companionId);
    if (companion) {
      companionInteraction = {
        companionName: companion.full_name,
        action: interactions[0].action as any,
      };
      boostReasons.push(`${companion.full_name} ${interactions[0].action} this`);
    }
  }

  // 🤝 COMPANION-OF-COMPANION BOOST (0.75x multiplier)
  if (context.secondDegreeIds.includes(post.author_id)) {
    score *= 0.75;
    boostReasons.push("Posted by companion's companion");
  }

  // Avoid showing user's own posts in For You feed
  if (post.author_id === context.userId) {
    score *= 0.1;
  }

  return {
    ...post,
    score: Math.round(score),
    boostReasons,
    companionInteraction,
  };
}

/**
 * Get user's direct companions
 */
async function getUserCompanions(userId: string): Promise<CompanionConnection[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("companion_connections")
    .select(`
      requester_id,
      recipient_id,
      requester:profiles!companion_connections_requester_id_fkey(id, username, full_name),
      recipient:profiles!companion_connections_recipient_id_fkey(id, username, full_name)
    `)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error || !data) return [];

  return data.map((conn: any) => {
    const profile = conn.requester_id === userId ? conn.recipient : conn.requester;
    return {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
    };
  });
}

/**
 * Get companion-of-companion (2nd degree connections)
 */
async function getCompanionOfCompanions(
  companionIds: string[],
  excludeUserId: string
): Promise<string[]> {
  if (companionIds.length === 0) return [];

  const supabase = createClient();
  const secondDegreeSet = new Set<string>();

  // For each companion, get their companions
  for (const companionId of companionIds.slice(0, 10)) { // Limit to avoid slow queries
    const { data } = await supabase
      .from("companion_connections")
      .select("requester_id, recipient_id")
      .or(`requester_id.eq.${companionId},recipient_id.eq.${companionId}`)
      .eq("status", "accepted")
      .limit(20);

    if (data) {
      data.forEach((conn: any) => {
        const otherId = conn.requester_id === companionId ? conn.recipient_id : conn.requester_id;
        if (otherId !== excludeUserId && !companionIds.includes(otherId)) {
          secondDegreeSet.add(otherId);
        }
      });
    }
  }

  return Array.from(secondDegreeSet);
}

/**
 * Get companion interactions (beneficial marks, comments) on posts
 */
async function getCompanionInteractions(
  postIds: string[],
  companionIds: string[]
): Promise<Map<string, { companionId: string; action: string }[]>> {
  if (postIds.length === 0 || companionIds.length === 0) {
    return new Map();
  }

  const supabase = createClient();
  const interactionsMap = new Map<string, { companionId: string; action: string }[]>();

  // Get beneficial marks from companions
  const { data: beneficialData } = await supabase
    .from("beneficial_marks")
    .select("post_id, user_id")
    .in("post_id", postIds)
    .in("user_id", companionIds);

  if (beneficialData) {
    beneficialData.forEach((mark: any) => {
      const existing = interactionsMap.get(mark.post_id) || [];
      existing.push({ companionId: mark.user_id, action: 'liked' });
      interactionsMap.set(mark.post_id, existing);
    });
  }

  // Get comments from companions
  const { data: commentData } = await supabase
    .from("comments")
    .select("post_id, author_id")
    .in("post_id", postIds)
    .in("author_id", companionIds);

  if (commentData) {
    commentData.forEach((comment: any) => {
      const existing = interactionsMap.get(comment.post_id) || [];
      existing.push({ companionId: comment.author_id, action: 'commented' });
      interactionsMap.set(comment.post_id, existing);
    });
  }

  return interactionsMap;
}

/**
 * Get trending posts with companion awareness
 */
export async function getTrendingPosts(userId: string, limit: number = 20): Promise<ScoredPost[]> {
  const supabase = createClient();

  // Get posts from last 48 hours with high engagement
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 48);

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id,
      author_id,
      content,
      created_at,
      beneficial_count,
      comment_count,
      is_pinned,
      halaqa_id,
      author:profiles!posts_author_id_fkey(username, full_name, avatar_url),
      halaqa:halaqas(name)
    `)
    .gte("created_at", cutoffDate.toISOString())
    .gte("beneficial_count", 5) // Minimum engagement threshold
    .order("beneficial_count", { ascending: false })
    .limit(limit);

  if (!posts) return [];

  // Get companions for boosting
  const companions = await getUserCompanions(userId);
  const companionIds = companions.map(c => c.id);

  // Score posts with companion awareness
  return (posts || []).map(post => {
    const author = post.author as any;
    const halaqa = post.halaqa as any;
    
    let score = post.beneficial_count * 10 + post.comment_count * 5;
    const boostReasons: string[] = [];

    // Boost if from companion
    if (companionIds.includes(post.author_id)) {
      score *= 1.3;
      boostReasons.push("Posted by your companion");
    }

    return {
      id: post.id,
      author_id: post.author_id,
      author_username: author?.username || 'unknown',
      author_full_name: author?.full_name || 'Unknown User',
      author_avatar_url: author?.avatar_url || null,
      content: post.content,
      created_at: post.created_at,
      beneficial_count: post.beneficial_count || 0,
      comment_count: post.comment_count || 0,
      is_pinned: post.is_pinned || false,
      halaqa_id: post.halaqa_id,
      halaqa_name: halaqa?.name,
      score: Math.round(score),
      boostReasons,
    };
  }).sort((a, b) => b.score - a.score);
}

