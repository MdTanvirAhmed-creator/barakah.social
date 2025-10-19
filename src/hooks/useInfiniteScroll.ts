"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  fetchMore: (page: number) => Promise<T[]>;
  initialData?: T[];
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  observerRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialData = [],
  pageSize = 10,
  threshold = 0.5,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Load initial data
  useEffect(() => {
    if (initialData.length === 0) {
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchMore(1);
      setData(results);
      setPage(1);
      setHasMore(results.length >= pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const results = await fetchMore(nextPage);
      
      if (results.length === 0) {
        setHasMore(false);
      } else {
        setData((prev) => [...prev, ...results]);
        setPage(nextPage);
        setHasMore(results.length >= pageSize);
        retryCount.current = 0; // Reset retry count on success
      }
    } catch (err) {
      setError(err as Error);
      
      // Automatic retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => {
          loadMore();
        }, 1000 * retryCount.current); // Exponential backoff
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, fetchMore, pageSize]);

  const retry = useCallback(() => {
    retryCount.current = 0;
    loadMore();
  }, [loadMore]);

  // Intersection Observer callback
  const observerRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoadingMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        },
        {
          threshold,
          rootMargin: "100px", // Start loading 100px before reaching the element
        }
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [isLoadingMore, hasMore, loadMore, threshold]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    observerRef,
  };
}
