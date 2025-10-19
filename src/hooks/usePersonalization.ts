import { useState, useEffect, useCallback } from 'react';
import { UserPersonalization, UserProfile, DailyPicks, ContentRecommendation, EngagementMetrics } from '@/lib/personalization/userPreferences';

interface UsePersonalizationOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UsePersonalizationReturn {
  profile: UserProfile | null;
  dailyPicks: DailyPicks | null;
  personalizedFeed: ContentRecommendation[];
  engagementMetrics: EngagementMetrics | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  refreshDailyPicks: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  trackView: (contentId: string, additionalData?: any) => Promise<void>;
  trackBeneficialMark: (contentId: string) => Promise<void>;
  trackBookmark: (contentId: string) => Promise<void>;
  getTopicRecommendations: (topic: string, limit?: number) => Promise<ContentRecommendation[]>;
  getCollaborativeRecommendations: (limit?: number) => Promise<ContentRecommendation[]>;
}

export function usePersonalization(options: UsePersonalizationOptions = {}): UsePersonalizationReturn {
  const {
    userId,
    autoRefresh = true,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPicks, setDailyPicks] = useState<DailyPicks | null>(null);
  const [personalizedFeed, setPersonalizedFeed] = useState<ContentRecommendation[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const refreshProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const userProfile = await personalization.buildUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  const refreshDailyPicks = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const picks = await personalization.getDailyPicks(userId);
      setDailyPicks(picks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily picks');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  const refreshFeed = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const feed = await personalization.getPersonalizedFeed(userId, 20);
      setPersonalizedFeed(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalized feed');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  const trackView = useCallback(async (contentId: string, additionalData?: any) => {
    if (!userId) return;

    try {
      await personalization.trackView(userId, contentId, additionalData);
      // Refresh profile after tracking to update preferences
      if (autoRefresh) {
        setTimeout(() => refreshProfile(), 1000);
      }
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [userId, personalization, autoRefresh, refreshProfile]);

  const trackBeneficialMark = useCallback(async (contentId: string) => {
    if (!userId) return;

    try {
      await personalization.trackBeneficialMark(userId, contentId);
      if (autoRefresh) {
        setTimeout(() => refreshProfile(), 1000);
      }
    } catch (err) {
      console.error('Error tracking beneficial mark:', err);
    }
  }, [userId, personalization, autoRefresh, refreshProfile]);

  const trackBookmark = useCallback(async (contentId: string) => {
    if (!userId) return;

    try {
      await personalization.trackBookmark(userId, contentId);
      if (autoRefresh) {
        setTimeout(() => refreshProfile(), 1000);
      }
    } catch (err) {
      console.error('Error tracking bookmark:', err);
    }
  }, [userId, personalization, autoRefresh, refreshProfile]);

  const getTopicRecommendations = useCallback(async (topic: string, limit: number = 10): Promise<ContentRecommendation[]> => {
    if (!userId) return [];

    try {
      return await personalization.getTopicRecommendations(userId, topic, limit);
    } catch (err) {
      console.error('Error getting topic recommendations:', err);
      return [];
    }
  }, [userId, personalization]);

  const getCollaborativeRecommendations = useCallback(async (limit: number = 10): Promise<ContentRecommendation[]> => {
    if (!userId) return [];

    try {
      return await personalization.getCollaborativeRecommendations(userId, limit);
    } catch (err) {
      console.error('Error getting collaborative recommendations:', err);
      return [];
    }
  }, [userId, personalization]);

  // Auto-refresh effect
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const interval = setInterval(() => {
      refreshProfile();
      refreshDailyPicks();
      refreshFeed();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, autoRefresh, refreshInterval, refreshProfile, refreshDailyPicks, refreshFeed]);

  // Initial load
  useEffect(() => {
    if (userId) {
      refreshProfile();
      refreshDailyPicks();
      refreshFeed();
    }
  }, [userId, refreshProfile, refreshDailyPicks, refreshFeed]);

  return {
    profile,
    dailyPicks,
    personalizedFeed,
    engagementMetrics,
    loading,
    error,
    refreshProfile,
    refreshDailyPicks,
    refreshFeed,
    trackView,
    trackBeneficialMark,
    trackBookmark,
    getTopicRecommendations,
    getCollaborativeRecommendations
  };
}

// Specialized hooks for different personalization features

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const userProfile = await personalization.buildUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile: loadProfile
  };
}

export function useDailyPicks(userId?: string) {
  const [dailyPicks, setDailyPicks] = useState<DailyPicks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const loadDailyPicks = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const picks = await personalization.getDailyPicks(userId);
      setDailyPicks(picks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily picks');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  useEffect(() => {
    if (userId) {
      loadDailyPicks();
    }
  }, [userId, loadDailyPicks]);

  return {
    dailyPicks,
    loading,
    error,
    refreshDailyPicks: loadDailyPicks
  };
}

export function usePersonalizedFeed(userId?: string, limit: number = 20) {
  const [feed, setFeed] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const loadFeed = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const personalizedFeed = await personalization.getPersonalizedFeed(userId, limit);
      setFeed(personalizedFeed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalized feed');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization, limit]);

  useEffect(() => {
    if (userId) {
      loadFeed();
    }
  }, [userId, loadFeed]);

  return {
    feed,
    loading,
    error,
    refreshFeed: loadFeed
  };
}

export function useTopicRecommendations(userId?: string) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const getRecommendations = useCallback(async (topic: string, limit: number = 10) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const recs = await personalization.getTopicRecommendations(userId, topic, limit);
      setRecommendations(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get topic recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  return {
    recommendations,
    loading,
    error,
    getRecommendations
  };
}

export function useCollaborativeRecommendations(userId?: string) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const getRecommendations = useCallback(async (limit: number = 10) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const recs = await personalization.getCollaborativeRecommendations(userId, limit);
      setRecommendations(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get collaborative recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, personalization]);

  return {
    recommendations,
    loading,
    error,
    getRecommendations
  };
}

export function useEngagementTracking(userId?: string) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalization = new UserPersonalization();

  const trackView = useCallback(async (contentId: string, additionalData?: any) => {
    if (!userId) return;

    try {
      await personalization.trackView(userId, contentId, additionalData);
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [userId, personalization]);

  const trackBeneficialMark = useCallback(async (contentId: string) => {
    if (!userId) return;

    try {
      await personalization.trackBeneficialMark(userId, contentId);
    } catch (err) {
      console.error('Error tracking beneficial mark:', err);
    }
  }, [userId, personalization]);

  const trackBookmark = useCallback(async (contentId: string) => {
    if (!userId) return;

    try {
      await personalization.trackBookmark(userId, contentId);
    } catch (err) {
      console.error('Error tracking bookmark:', err);
    }
  }, [userId, personalization]);

  return {
    metrics,
    loading,
    error,
    trackView,
    trackBeneficialMark,
    trackBookmark
  };
}
