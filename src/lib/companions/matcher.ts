/**
 * Companion Matcher Algorithm
 * 
 * Sophisticated matching system that finds compatible companions based on:
 * - Shared Halaqa memberships
 * - Content preference overlap (beneficial marks)
 * - Activity time patterns
 * - Interaction styles
 * - Geographic proximity
 * - Knowledge levels and interests
 * 
 * Returns compatibility scores from 0-100
 */

import { createClient } from "@/lib/supabase/client";

export interface CompatibilityFactors {
  halaqaOverlap: number;        // 0-25 points
  contentOverlap: number;        // 0-20 points
  activityPatternMatch: number;  // 0-15 points
  interactionStyle: number;      // 0-15 points
  geographicProximity: number;   // 0-10 points
  interestAlignment: number;     // 0-15 points
}

export interface CompanionMatch {
  userId: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[];
  beneficial_count: number;
  compatibilityScore: number;
  factors: CompatibilityFactors;
  matchReasons: string[];
  sharedHalaqas: string[];
  location?: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[];
  beneficial_count: number;
  location?: string;
  personality_traits?: string[];
  life_stage?: string;
  last_active?: string;
}

interface MatchingOptions {
  userId: string;
  limit?: number;
  minScore?: number;
  excludeExistingConnections?: boolean;
  preferredInterests?: string[];
  locationRadius?: number; // in km
}

/**
 * Find compatible companions for a user
 */
export async function findCompanionMatches(options: MatchingOptions): Promise<CompanionMatch[]> {
  const {
    userId,
    limit = 10,
    minScore = 30,
    excludeExistingConnections = true,
  } = options;

  const supabase = createClient();

  try {
    // 1. Get current user's profile and preferences
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      console.error("Error loading user profile:", userError);
      return [];
    }

    // 2. Get existing connections to exclude
    let existingConnectionIds: string[] = [];
    if (excludeExistingConnections) {
      const { data: connections } = await supabase
        .from("companion_connections")
        .select("requester_id, recipient_id")
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .in("status", ["accepted", "pending"]);

      existingConnectionIds = (connections || []).map(c => 
        c.requester_id === userId ? c.recipient_id : c.requester_id
      );
    }

    // 3. Get candidate profiles (active users)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Active in last 30 days

    const { data: candidates, error: candidatesError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .not("id", "in", `(${existingConnectionIds.join(",")})`)
      .eq("is_available_for_connections", true)
      .gte("last_active", cutoffDate.toISOString())
      .limit(100); // Process top 100 candidates

    if (candidatesError || !candidates) {
      console.error("Error loading candidates:", candidatesError);
      return [];
    }

    // 4. Calculate compatibility for each candidate
    const matches: CompanionMatch[] = [];

    for (const candidate of candidates) {
      const compatibility = await calculateCompatibility(userId, userProfile, candidate);
      
      if (compatibility.compatibilityScore >= minScore) {
        matches.push({
          userId: candidate.id,
          username: candidate.username,
          full_name: candidate.full_name,
          avatar_url: candidate.avatar_url,
          bio: candidate.bio,
          interests: candidate.interests || [],
          beneficial_count: candidate.beneficial_count || 0,
          location: candidate.location,
          ...compatibility,
        });
      }
    }

    // 5. Sort by score and return top matches
    return matches
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

  } catch (error) {
    console.error("Error in companion matcher:", error);
    return [];
  }
}

/**
 * Calculate comprehensive compatibility score between two users
 */
async function calculateCompatibility(
  userId: string,
  userProfile: UserProfile,
  candidate: UserProfile
): Promise<Omit<CompanionMatch, 'userId' | 'username' | 'full_name' | 'avatar_url' | 'bio' | 'interests' | 'beneficial_count' | 'location'>> {
  const supabase = createClient();
  
  const factors: CompatibilityFactors = {
    halaqaOverlap: 0,
    contentOverlap: 0,
    activityPatternMatch: 0,
    interactionStyle: 0,
    geographicProximity: 0,
    interestAlignment: 0,
  };

  const matchReasons: string[] = [];
  let sharedHalaqas: string[] = [];

  // 1. Halaqa Overlap (0-25 points)
  const halaqaScore = await calculateHalaqaOverlap(userId, candidate.id);
  factors.halaqaOverlap = halaqaScore.score;
  sharedHalaqas = halaqaScore.sharedHalaqas;
  if (halaqaScore.score > 0) {
    matchReasons.push(`${halaqaScore.sharedHalaqas.length} shared Halaqa${halaqaScore.sharedHalaqas.length > 1 ? 's' : ''}`);
  }

  // 2. Content Overlap (0-20 points) - Similar beneficial marks
  const contentScore = await calculateContentOverlap(userId, candidate.id);
  factors.contentOverlap = contentScore;
  if (contentScore > 10) {
    matchReasons.push("Similar content preferences");
  }

  // 3. Activity Pattern Match (0-15 points)
  const activityScore = calculateActivityPattern(userProfile, candidate);
  factors.activityPatternMatch = activityScore;
  if (activityScore > 10) {
    matchReasons.push("Active at similar times");
  }

  // 4. Interaction Style (0-15 points)
  const interactionScore = calculateInteractionStyle(userProfile, candidate);
  factors.interactionStyle = interactionScore;

  // 5. Geographic Proximity (0-10 points)
  const geoScore = calculateGeographicProximity(userProfile, candidate);
  factors.geographicProximity = geoScore;
  if (geoScore > 5) {
    matchReasons.push("In your area");
  }

  // 6. Interest Alignment (0-15 points)
  const interestScore = calculateInterestAlignment(userProfile, candidate);
  factors.interestAlignment = interestScore;
  if (interestScore > 10) {
    const sharedCount = getSharedInterests(userProfile, candidate).length;
    matchReasons.push(`${sharedCount} shared interest${sharedCount > 1 ? 's' : ''}`);
  }

  // Calculate total score
  const compatibilityScore = Math.min(
    factors.halaqaOverlap +
    factors.contentOverlap +
    factors.activityPatternMatch +
    factors.interactionStyle +
    factors.geographicProximity +
    factors.interestAlignment,
    100
  );

  return {
    compatibilityScore: Math.round(compatibilityScore),
    factors,
    matchReasons,
    sharedHalaqas,
  };
}

/**
 * Calculate Halaqa overlap score
 */
async function calculateHalaqaOverlap(
  userId: string,
  candidateId: string
): Promise<{ score: number; sharedHalaqas: string[] }> {
  const supabase = createClient();

  // Get user's Halaqas
  const { data: userHalaqas } = await supabase
    .from("halaqa_members")
    .select("halaqa_id, halaqas(name)")
    .eq("user_id", userId);

  // Get candidate's Halaqas
  const { data: candidateHalaqas } = await supabase
    .from("halaqa_members")
    .select("halaqa_id")
    .eq("user_id", candidateId);

  if (!userHalaqas || !candidateHalaqas) {
    return { score: 0, sharedHalaqas: [] };
  }

  const userHalaqaIds = new Set(userHalaqas.map(h => h.halaqa_id));
  const sharedHalaqaIds = candidateHalaqas
    .filter(h => userHalaqaIds.has(h.halaqa_id))
    .map(h => h.halaqa_id);

  const sharedHalaqaNames = userHalaqas
    .filter(h => sharedHalaqaIds.includes(h.halaqa_id))
    .map(h => (h.halaqas as any)?.name || 'Unknown')
    .filter(Boolean);

  // Score: 10 points per shared Halaqa, max 25
  const score = Math.min(sharedHalaqaIds.length * 10, 25);

  return {
    score,
    sharedHalaqas: sharedHalaqaNames,
  };
}

/**
 * Calculate content preference overlap (beneficial marks)
 */
async function calculateContentOverlap(userId: string, candidateId: string): Promise<number> {
  const supabase = createClient();

  // Get user's beneficial marks
  const { data: userMarks } = await supabase
    .from("beneficial_marks")
    .select("post_id")
    .eq("user_id", userId)
    .limit(50);

  // Get candidate's beneficial marks
  const { data: candidateMarks } = await supabase
    .from("beneficial_marks")
    .select("post_id")
    .eq("user_id", candidateId)
    .limit(50);

  if (!userMarks || !candidateMarks) return 0;

  const userPostIds = new Set(userMarks.map(m => m.post_id));
  const sharedMarks = candidateMarks.filter(m => userPostIds.has(m.post_id)).length;

  // Score based on overlap percentage, max 20 points
  const overlapPercentage = sharedMarks / Math.min(userMarks.length, candidateMarks.length);
  return Math.min(Math.round(overlapPercentage * 20), 20);
}

/**
 * Calculate activity pattern similarity
 */
function calculateActivityPattern(userProfile: UserProfile, candidate: UserProfile): number {
  // For now, use last_active as a proxy for activity patterns
  // In production, would analyze hourly activity logs
  
  if (!userProfile.last_active || !candidate.last_active) return 5; // Neutral score

  const userLastActive = new Date(userProfile.last_active);
  const candidateLastActive = new Date(candidate.last_active);
  
  const hoursDiff = Math.abs(userLastActive.getTime() - candidateLastActive.getTime()) / (1000 * 60 * 60);
  
  // Similar activity = higher score
  if (hoursDiff < 24) return 15;        // Both active within 24 hours
  if (hoursDiff < 72) return 10;        // Both active within 3 days
  if (hoursDiff < 168) return 5;        // Both active within a week
  return 0;
}

/**
 * Calculate interaction style compatibility
 */
function calculateInteractionStyle(userProfile: UserProfile, candidate: UserProfile): number {
  const userActivity = userProfile.beneficial_count || 0;
  const candidateActivity = candidate.beneficial_count || 0;

  // Similar activity levels = better match
  const activityRatio = Math.min(userActivity, candidateActivity) / Math.max(userActivity, candidateActivity, 1);
  
  return Math.round(activityRatio * 15);
}

/**
 * Calculate geographic proximity score
 */
function calculateGeographicProximity(userProfile: UserProfile, candidate: UserProfile): number {
  // Simple location-based scoring
  // In production, would use actual geocoding and distance calculation
  
  if (!userProfile.location || !candidate.location) return 3; // Neutral score

  const userLocation = userProfile.location.toLowerCase();
  const candidateLocation = candidate.location.toLowerCase();

  // Exact match
  if (userLocation === candidateLocation) return 10;

  // Contains same city/region
  const userParts = userLocation.split(',').map(s => s.trim());
  const candidateParts = candidateLocation.split(',').map(s => s.trim());
  
  for (const userPart of userParts) {
    if (candidateParts.some(cp => cp.includes(userPart) || userPart.includes(cp))) {
      return 7;
    }
  }

  return 0;
}

/**
 * Calculate interest alignment score
 */
function calculateInterestAlignment(userProfile: UserProfile, candidate: UserProfile): number {
  const sharedInterests = getSharedInterests(userProfile, candidate);
  
  if (sharedInterests.length === 0) return 0;

  // Score based on number of shared interests, max 15 points
  return Math.min(sharedInterests.length * 5, 15);
}

/**
 * Get shared interests between two users
 */
function getSharedInterests(userProfile: UserProfile, candidate: UserProfile): string[] {
  const userInterests = new Set((userProfile.interests || []).map(i => i.toLowerCase()));
  const candidateInterests = (candidate.interests || []).map(i => i.toLowerCase());
  
  return candidateInterests.filter(interest => userInterests.has(interest));
}

/**
 * Find study partner matches for a specific topic
 */
export async function findStudyPartners(
  userId: string,
  topic: string,
  limit: number = 5
): Promise<CompanionMatch[]> {
  const matches = await findCompanionMatches({
    userId,
    limit: limit * 2, // Get more to filter
    minScore: 20,
    preferredInterests: [topic],
  });

  // Filter for those interested in the topic
  return matches
    .filter(match => 
      match.interests.some(interest => 
        interest.toLowerCase().includes(topic.toLowerCase())
      )
    )
    .slice(0, limit);
}

/**
 * Find mentor matches (users with high knowledge/experience)
 */
export async function findMentors(
  userId: string,
  subjectArea?: string,
  limit: number = 5
): Promise<CompanionMatch[]> {
  const supabase = createClient();

  // Get users who can be mentors
  const { data: potentialMentors } = await supabase
    .from("user_matching_preferences")
    .select(`
      user_id,
      profiles:user_id(*)
    `)
    .eq("can_be_mentor", true)
    .limit(50);

  if (!potentialMentors) return [];

  const candidates = potentialMentors.map((pm: any) => pm.profiles).filter(Boolean);

  // Calculate compatibility
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!userProfile) return [];

  const matches: CompanionMatch[] = [];

  for (const candidate of candidates) {
    const compatibility = await calculateCompatibility(userId, userProfile, candidate);
    
    // Mentor bonus: +10 points
    const mentorScore = compatibility.compatibilityScore + 10;
    
    matches.push({
      userId: candidate.id,
      username: candidate.username,
      full_name: candidate.full_name,
      avatar_url: candidate.avatar_url,
      bio: candidate.bio,
      interests: candidate.interests || [],
      beneficial_count: candidate.beneficial_count || 0,
      compatibilityScore: Math.min(mentorScore, 100),
      factors: compatibility.factors,
      matchReasons: [...compatibility.matchReasons, "Available as mentor"],
      sharedHalaqas: compatibility.sharedHalaqas,
    });
  }

  return matches
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}

