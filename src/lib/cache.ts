"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale-while-revalidate strategy
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode
      networkMode: "online",
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      networkMode: "online",
    },
  },
});

// Cache key factories for consistency
export const cacheKeys = {
  // Posts
  posts: {
    all: ["posts"] as const,
    list: (filters?: Record<string, any>) => ["posts", "list", filters] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
    byUser: (userId: string) => ["posts", "byUser", userId] as const,
    byHalaqa: (halaqaId: string) => ["posts", "byHalaqa", halaqaId] as const,
  },
  
  // Users
  users: {
    all: ["users"] as const,
    current: ["users", "current"] as const,
    profile: (id: string) => ["users", "profile", id] as const,
    search: (query: string) => ["users", "search", query] as const,
  },
  
  // Halaqas
  halaqas: {
    all: ["halaqas"] as const,
    list: (filters?: Record<string, any>) => ["halaqas", "list", filters] as const,
    detail: (id: string) => ["halaqas", "detail", id] as const,
    members: (id: string) => ["halaqas", "members", id] as const,
    myHalaqas: ["halaqas", "myHalaqas"] as const,
  },
  
  // Comments
  comments: {
    byPost: (postId: string) => ["comments", "byPost", postId] as const,
    replies: (commentId: string) => ["comments", "replies", commentId] as const,
  },
  
  // Knowledge
  knowledge: {
    all: ["knowledge"] as const,
    list: (filters?: Record<string, any>) => ["knowledge", "list", filters] as const,
    detail: (id: string) => ["knowledge", "detail", id] as const,
    learningPaths: ["knowledge", "learningPaths"] as const,
  },
  
  // Bookmarks
  bookmarks: {
    all: ["bookmarks"] as const,
    byUser: (userId: string) => ["bookmarks", "byUser", userId] as const,
  },
  
  // Search
  search: {
    results: (query: string, filters?: Record<string, any>) => 
      ["search", query, filters] as const,
  },
};

// Optimistic update utilities
export const optimisticUpdateHelpers = {
  // Add item to list optimistically
  addToList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newItem: T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old = []) => [newItem, ...old]);
  },

  // Remove item from list optimistically
  removeFromList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.filter((item) => item.id !== itemId)
    );
  },

  // Update item in list optimistically
  updateInList: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  },

  // Increment counter optimistically
  incrementCounter: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string,
    field: keyof T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.map((item) =>
        item.id === itemId
          ? { ...item, [field]: ((item[field] as number) || 0) + 1 }
          : item
      )
    );
  },

  // Decrement counter optimistically
  decrementCounter: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string,
    field: keyof T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.map((item) =>
        item.id === itemId
          ? { ...item, [field]: Math.max(((item[field] as number) || 0) - 1, 0) }
          : item
      )
    );
  },
};

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all posts
  invalidatePosts: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.posts.all });
  },

  // Invalidate specific post
  invalidatePost: (queryClient: QueryClient, postId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.posts.detail(postId) });
  },

  // Invalidate user profile
  invalidateUserProfile: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.users.profile(userId) });
    queryClient.invalidateQueries({ queryKey: cacheKeys.users.current });
  },

  // Invalidate halaqa
  invalidateHalaqa: (queryClient: QueryClient, halaqaId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.halaqas.detail(halaqaId) });
    queryClient.invalidateQueries({ queryKey: cacheKeys.halaqas.all });
  },

  // Invalidate comments
  invalidateComments: (queryClient: QueryClient, postId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.comments.byPost(postId) });
  },

  // Invalidate search results
  invalidateSearch: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["search"] });
  },
};

// Prefetch utilities for better UX
export const prefetchHelpers = {
  // Prefetch post details when hovering over post card
  prefetchPost: (queryClient: QueryClient, postId: string, fetcher: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey: cacheKeys.posts.detail(postId),
      queryFn: fetcher,
      staleTime: 1000 * 60 * 5,
    });
  },

  // Prefetch user profile when hovering over username
  prefetchUserProfile: (queryClient: QueryClient, userId: string, fetcher: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey: cacheKeys.users.profile(userId),
      queryFn: fetcher,
      staleTime: 1000 * 60 * 10,
    });
  },

  // Prefetch halaqa details
  prefetchHalaqa: (queryClient: QueryClient, halaqaId: string, fetcher: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey: cacheKeys.halaqas.detail(halaqaId),
      queryFn: fetcher,
      staleTime: 1000 * 60 * 5,
    });
  },
};

// Export React Query components for use in app
export { QueryClientProvider, ReactQueryDevtools };
