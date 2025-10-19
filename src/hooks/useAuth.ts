// This hook is deprecated - use useSupabaseAuth instead
// Import from: @/hooks/useSupabaseAuth

import { useSupabaseAuth } from "./useSupabaseAuth";

export function useAuth() {
  const { user, loading } = useSupabaseAuth();
  return { user, loading };
}

