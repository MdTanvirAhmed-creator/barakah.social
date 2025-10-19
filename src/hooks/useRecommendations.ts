import { useState, useEffect, useCallback } from 'react';
import { ContentRecommender, RecommendationResult, RecommendationContext } from '@/lib/recommendations/contentRecommender';

interface UseRecommendationsOptions {
  userId?: string;
  contentId?: string;
  halaqaIds?: string[];
  category?: string;
  limit?: number;
  includeTrending?: boolean;
  includeEditorial?: boolean;
  includeFresh?: boolean;
  autoLoad?: boolean;
}

interface UseRecommendationsReturn {
  recommendations: RecommendationResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const {
    userId,
    contentId,
    halaqaIds,
    category,
    limit = 20,
    includeTrending = true,
    includeEditorial = true,
    includeFresh = false,
    autoLoad = true
  } = options;

  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(limit);

  const recommender = new ContentRecommender();

  const loadRecommendations = useCallback(async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const context: RecommendationContext = {
        userId,
        contentId,
        halaqaIds,
        category,
        limit: reset ? limit : currentLimit,
        excludeViewed: true
      };

      let results: RecommendationResult[] = [];

      if (userId) {
        // Get personalized recommendations
        results = await recommender.getPersonalizedRecs(userId, {
          halaqaIds,
          category,
          limit: reset ? limit : currentLimit,
          includeTrending,
          includeEditorial
        });
      } else if (contentId) {
        // Get content-specific recommendations
        results = await recommender.getContentRecs(contentId, reset ? limit : currentLimit);
      } else if (category) {
        // Get category-specific recommendations
        results = await recommender.getCategoryTrending(category, reset ? limit : currentLimit);
      } else {
        // Get general recommendations
        results = await recommender.getCombinedRecs(context);
      }

      // Add fresh content if requested
      if (includeFresh) {
        const freshContent = await recommender.getFreshContent(Math.ceil(limit * 0.3));
        results = [...results, ...freshContent];
      }

      if (reset) {
        setRecommendations(results);
        setCurrentLimit(limit);
      } else {
        setRecommendations(prev => [...prev, ...results]);
        setCurrentLimit(prev => prev + limit);
      }

      setHasMore(results.length === (reset ? limit : currentLimit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    contentId,
    halaqaIds,
    category,
    limit,
    includeTrending,
    includeEditorial,
    includeFresh,
    currentLimit,
    loading,
    recommender
  ]);

  const refetch = useCallback(async () => {
    await loadRecommendations(true);
  }, [loadRecommendations]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadRecommendations(false);
    }
  }, [loadRecommendations, loading, hasMore]);

  useEffect(() => {
    if (autoLoad) {
      loadRecommendations(true);
    }
  }, [autoLoad, loadRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch,
    loadMore,
    hasMore
  };
}

// Specialized hooks for different recommendation types

export function useHistoryBasedRecs(userId: string, limit = 10) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new ContentRecommender();

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await recommender.getHistoryBasedRecs(userId, limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, limit, recommender]);

  useEffect(() => {
    if (userId) {
      loadRecs();
    }
  }, [userId, loadRecs]);

  return { recommendations, loading, error, refetch: loadRecs };
}

export function useTagBasedRecs(contentId: string, limit = 10) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new ContentRecommender();

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await recommender.getTagBasedRecs(contentId, limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [contentId, limit, recommender]);

  useEffect(() => {
    if (contentId) {
      loadRecs();
    }
  }, [contentId, loadRecs]);

  return { recommendations, loading, error, refetch: loadRecs };
}

export function useTrendingContent(halaqaIds?: string[], limit = 20) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new ContentRecommender();

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await recommender.getTrendingContent(halaqaIds, limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending content');
    } finally {
      setLoading(false);
    }
  }, [halaqaIds, limit, recommender]);

  useEffect(() => {
    loadRecs();
  }, [loadRecs]);

  return { recommendations, loading, error, refetch: loadRecs };
}

export function useEditorialPicks(category?: string, limit = 10) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new ContentRecommender();

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await recommender.getEditorialPicks(category, limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load editorial picks');
    } finally {
      setLoading(false);
    }
  }, [category, limit, recommender]);

  useEffect(() => {
    loadRecs();
  }, [loadRecs]);

  return { recommendations, loading, error, refetch: loadRecs };
}

export function useFreshContent(limit = 15) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new ContentRecommender();

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await recommender.getFreshContent(limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fresh content');
    } finally {
      setLoading(false);
    }
  }, [limit, recommender]);

  useEffect(() => {
    loadRecs();
  }, [loadRecs]);

  return { recommendations, loading, error, refetch: loadRecs };
}
