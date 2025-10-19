"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface UseVirtualScrollReturn {
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
  }>;
  totalHeight: number;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, []);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
      });
    }

    return items;
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;

  return {
    virtualItems,
    totalHeight,
    scrollRef,
  };
}

// Simpler hook for dynamic heights (more complex but flexible)
export function useDynamicVirtualScroll<T>(items: T[], estimatedItemHeight = 100) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeights = useRef<Map<number, number>>(new Map());

  const measureItem = (index: number, height: number) => {
    itemHeights.current.set(index, height);
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const clientHeight = element.clientHeight;

      let accumulatedHeight = 0;
      let start = 0;
      let end = items.length;

      // Find start index
      for (let i = 0; i < items.length; i++) {
        const itemHeight = itemHeights.current.get(i) || estimatedItemHeight;
        if (accumulatedHeight + itemHeight > scrollTop) {
          start = Math.max(0, i - 2);
          break;
        }
        accumulatedHeight += itemHeight;
      }

      // Find end index
      accumulatedHeight = 0;
      for (let i = start; i < items.length; i++) {
        const itemHeight = itemHeights.current.get(i) || estimatedItemHeight;
        accumulatedHeight += itemHeight;
        if (accumulatedHeight > scrollTop + clientHeight) {
          end = Math.min(items.length, i + 3);
          break;
        }
      }

      setVisibleRange({ start, end });
    };

    handleScroll(); // Initial calculation
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [items.length, estimatedItemHeight]);

  return {
    visibleRange,
    containerRef,
    measureItem,
    visibleItems: items.slice(visibleRange.start, visibleRange.end),
  };
}
