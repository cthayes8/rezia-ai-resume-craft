import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface AnalyticsCacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
}

export function useAnalyticsCache<T>(config: AnalyticsCacheConfig = { maxSize: 100, defaultTTL: 5 * 60 * 1000 }) {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  });

  const generateKey = (params: Record<string, any>): string => {
    return JSON.stringify(params, Object.keys(params).sort());
  };

  const cleanup = () => {
    const now = Date.now();
    const expired: string[] = [];
    
    cache.current.forEach((entry, key) => {
      if (now > entry.expiry) {
        expired.push(key);
      }
    });

    expired.forEach(key => cache.current.delete(key));
    
    // If still over max size, remove oldest entries
    if (cache.current.size > config.maxSize) {
      const entries = Array.from(cache.current.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.current.size - config.maxSize);
      toRemove.forEach(([key]) => cache.current.delete(key));
    }

    setCacheStats(prev => ({ ...prev, size: cache.current.size }));
  };

  const get = (params: Record<string, any>): T | null => {
    const key = generateKey(params);
    const entry = cache.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1, size: prev.size - 1 }));
      return null;
    }

    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data;
  };

  const set = (params: Record<string, any>, data: T, ttl: number = config.defaultTTL): void => {
    const key = generateKey(params);
    const now = Date.now();
    
    cache.current.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl
    });

    cleanup();
  };

  const clear = (): void => {
    cache.current.clear();
    setCacheStats({ hits: 0, misses: 0, size: 0 });
  };

  const invalidate = (pattern?: string): void => {
    if (!pattern) {
      clear();
      return;
    }

    const keysToDelete: string[] = [];
    cache.current.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => cache.current.delete(key));
    setCacheStats(prev => ({ ...prev, size: cache.current.size }));
  };

  // Cleanup on mount and periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, []);

  return {
    get,
    set,
    clear,
    invalidate,
    stats: cacheStats
  };
}