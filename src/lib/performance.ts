// Performance Monitoring Utilities

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initObservers();
    }
  }

  private initObservers() {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.recordMetric("LCP", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn("LCP observer not supported");
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric("FID", entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn("FID observer not supported");
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric("CLS", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn("CLS observer not supported");
    }
  }

  recordMetric(name: string, value: number) {
    const rating = this.getRating(name, value);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms (${rating})`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(metric);
    }
  }

  private getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return "good";

    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: metric.value,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility to measure component render time
export function measureComponentRender(componentName: string) {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${componentName}-render`, duration);
  };
}

// Utility to measure API call time
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`api-${name}`, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`api-${name}-error`, duration);
    throw error;
  }
}

// Resource hints for better performance
export function addResourceHints(urls: string[], type: "preconnect" | "prefetch" | "preload") {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = type;
    link.href = url;
    if (type === "preconnect") {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  });
}

// Check if browser supports modern features
export const browserSupport = {
  intersectionObserver: typeof IntersectionObserver !== "undefined",
  serviceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  webp: false,
  avif: false,
};

// Check image format support
if (typeof window !== "undefined") {
  // Check WebP support
  const webpTest = new Image();
  webpTest.onload = webpTest.onerror = function() {
    browserSupport.webp = webpTest.height === 1;
  };
  webpTest.src = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";

  // Check AVIF support
  const avifTest = new Image();
  avifTest.onload = avifTest.onerror = function() {
    browserSupport.avif = avifTest.height === 1;
  };
  avifTest.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
}
