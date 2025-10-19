import { useState, useEffect, useCallback } from 'react';
import { QueryProcessor, ProcessedQuery } from '@/lib/search/queryProcessor';

interface UseQueryProcessorOptions {
  autoProcess?: boolean;
  debounceMs?: number;
  saveToHistory?: boolean;
  userId?: string;
}

interface UseQueryProcessorReturn {
  processedQuery: ProcessedQuery | null;
  processing: boolean;
  error: string | null;
  suggestions: string[];
  processQuery: (query: string) => Promise<void>;
  clearQuery: () => void;
  getSuggestions: (query: string) => Promise<void>;
}

export function useQueryProcessor(options: UseQueryProcessorOptions = {}): UseQueryProcessorReturn {
  const {
    autoProcess = true,
    debounceMs = 300,
    saveToHistory = true,
    userId
  } = options;

  const [processedQuery, setProcessedQuery] = useState<ProcessedQuery | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  const queryProcessor = new QueryProcessor();

  const processQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProcessedQuery(null);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const processed = await queryProcessor.processQuery(query);
      setProcessedQuery(processed);
      setCurrentQuery(query);

      // Save to history if enabled
      if (saveToHistory) {
        await queryProcessor.saveSearchQuery(query, userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query');
    } finally {
      setProcessing(false);
    }
  }, [queryProcessor, saveToHistory, userId]);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const querySuggestions = await queryProcessor.getSearchSuggestions(query);
      setSuggestions(querySuggestions);
    } catch (err) {
      console.error('Error getting suggestions:', err);
    }
  }, [queryProcessor]);

  const clearQuery = useCallback(() => {
    setProcessedQuery(null);
    setCurrentQuery('');
    setSuggestions([]);
    setError(null);
  }, []);

  // Debounced processing
  useEffect(() => {
    if (!autoProcess || !currentQuery) return;

    const timeoutId = setTimeout(() => {
      processQuery(currentQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [currentQuery, autoProcess, debounceMs, processQuery]);

  return {
    processedQuery,
    processing,
    error,
    suggestions,
    processQuery,
    clearQuery,
    getSuggestions
  };
}

// Specialized hooks for different query processing features

export function useSynonymExpansion() {
  const [expandedQuery, setExpandedQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryProcessor = new QueryProcessor();

  const expandQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setExpandedQuery('');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const expanded = await queryProcessor.expandQuery(query);
      setExpandedQuery(expanded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand query');
    } finally {
      setLoading(false);
    }
  }, [queryProcessor]);

  return {
    expandedQuery,
    loading,
    error,
    expandQuery
  };
}

export function useCategoryDetection() {
  const [detectedCategories, setDetectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryProcessor = new QueryProcessor();

  const detectCategories = useCallback(async (query: string) => {
    if (!query.trim()) {
      setDetectedCategories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categories = queryProcessor.detectCategory(query);
      setDetectedCategories(categories.map(cat => cat.category));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect categories');
    } finally {
      setLoading(false);
    }
  }, [queryProcessor]);

  return {
    detectedCategories,
    loading,
    error,
    detectCategories
  };
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryProcessor = new QueryProcessor();

  const getSuggestions = useCallback(async (query: string, limit = 5) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const querySuggestions = await queryProcessor.getSearchSuggestions(query, limit);
      setSuggestions(querySuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }, [queryProcessor]);

  return {
    suggestions,
    loading,
    error,
    getSuggestions
  };
}

export function useFuzzySearch() {
  const [fuzzyResults, setFuzzyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryProcessor = new QueryProcessor();

  const performFuzzySearch = useCallback(async (query: string, threshold = 0.3) => {
    if (!query.trim()) {
      setFuzzyResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fuzzyQuery = await queryProcessor.fuzzySearch(query, threshold);
      // Note: In a real implementation, you would execute the query here
      // For now, we'll just return the query structure
      setFuzzyResults([fuzzyQuery]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform fuzzy search');
    } finally {
      setLoading(false);
    }
  }, [queryProcessor]);

  return {
    fuzzyResults,
    loading,
    error,
    performFuzzySearch
  };
}

export function useQueryAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryProcessor = new QueryProcessor();

  const analyzeQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAnalytics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stats = await queryProcessor.getSearchStats(query);
      setAnalytics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze query');
    } finally {
      setLoading(false);
    }
  }, [queryProcessor]);

  return {
    analytics,
    loading,
    error,
    analyzeQuery
  };
}
