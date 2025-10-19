"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { optimisticUpdateHelpers } from "@/lib/cache";
import { useToast } from "@/hooks/useToast";

interface UseOptimisticUpdateOptions<T> {
  queryKey: readonly unknown[];
  mutationFn: (data: T) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate<T extends { id: string }>({
  queryKey,
  mutationFn,
  onSuccess,
  onError,
}: UseOptimisticUpdateOptions<T>) {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  const update = useCallback(
    async (itemId: string, updates: Partial<T>) => {
      // Snapshot previous state
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      optimisticUpdateHelpers.updateInList(
        queryClient,
        queryKey,
        itemId,
        updates
      );

      try {
        // Perform actual mutation
        const result = await mutationFn({ id: itemId, ...updates } as T);
        onSuccess?.(result);
        return result;
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(queryKey, previousData);
        showError("Update failed. Please try again.");
        onError?.(error as Error);
        throw error;
      }
    },
    [queryClient, queryKey, mutationFn, onSuccess, onError, showError]
  );

  return { update };
}

// Specific hook for beneficial marks (like/unlike)
export function useOptimisticBeneficial() {
  const queryClient = useQueryClient();

  const toggleBeneficial = useCallback(
    async (postId: string, isCurrentlyBeneficial: boolean, queryKey: readonly unknown[]) => {
      // Snapshot
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic update
      if (isCurrentlyBeneficial) {
        optimisticUpdateHelpers.decrementCounter(
          queryClient,
          queryKey,
          postId,
          "beneficial_count" as any
        );
        optimisticUpdateHelpers.updateInList(queryClient, queryKey, postId, {
          is_beneficial: false,
        } as any);
      } else {
        optimisticUpdateHelpers.incrementCounter(
          queryClient,
          queryKey,
          postId,
          "beneficial_count" as any
        );
        optimisticUpdateHelpers.updateInList(queryClient, queryKey, postId, {
          is_beneficial: true,
        } as any);
      }

      // Return rollback function
      return () => {
        queryClient.setQueryData(queryKey, previousData);
      };
    },
    [queryClient]
  );

  return { toggleBeneficial };
}

// Specific hook for bookmarks
export function useOptimisticBookmark() {
  const queryClient = useQueryClient();

  const toggleBookmark = useCallback(
    async (postId: string, isCurrentlyBookmarked: boolean, queryKey: readonly unknown[]) => {
      // Snapshot
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic update
      optimisticUpdateHelpers.updateInList(queryClient, queryKey, postId, {
        is_bookmarked: !isCurrentlyBookmarked,
      } as any);

      // Return rollback function
      return () => {
        queryClient.setQueryData(queryKey, previousData);
      };
    },
    [queryClient]
  );

  return { toggleBookmark };
}
