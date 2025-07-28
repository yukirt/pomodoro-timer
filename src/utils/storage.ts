// Optimized localStorage utilities with caching and batching

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

class OptimizedStorage {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingWrites = new Map<string, any>();
  private writeTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // Batch writes every 100ms
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default cache TTL

  /**
   * Get item from cache first, then localStorage
   */
  getItem<T>(key: string, defaultValue?: T, ttl?: number): T | null {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached) {
        const now = Date.now();
        const itemTtl = cached.ttl || this.DEFAULT_TTL;
        
        if (now - cached.timestamp < itemTtl) {
          return cached.data;
        } else {
          // Cache expired, remove it
          this.cache.delete(key);
        }
      }

      // Get from localStorage
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }

      const parsed = JSON.parse(item);
      
      // Cache the result
      this.cache.set(key, {
        data: parsed,
        timestamp: Date.now(),
        ttl
      });

      return parsed;
    } catch (error) {
      console.error(`Error reading from storage key "${key}":`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item with batched writes to improve performance
   */
  setItem<T>(key: string, value: T, immediate = false): void {
    try {
      // Update cache immediately
      this.cache.set(key, {
        data: value,
        timestamp: Date.now()
      });

      if (immediate) {
        // Write immediately
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        // Batch the write
        this.pendingWrites.set(key, value);
        this.scheduleBatchWrite();
      }
    } catch (error) {
      console.error(`Error writing to storage key "${key}":`, error);
    }
  }

  /**
   * Remove item from both cache and localStorage
   */
  removeItem(key: string): void {
    try {
      this.cache.delete(key);
      this.pendingWrites.delete(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get multiple items efficiently
   */
  getMultipleItems<T>(keys: string[], defaultValue?: T): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.getItem(key, defaultValue);
    }
    
    return result;
  }

  /**
   * Set multiple items efficiently
   */
  setMultipleItems<T>(items: Record<string, T>, immediate = false): void {
    for (const [key, value] of Object.entries(items)) {
      this.setItem(key, value, immediate);
    }
  }

  /**
   * Schedule batched write operation
   */
  private scheduleBatchWrite(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(() => {
      this.flushPendingWrites();
    }, this.BATCH_DELAY);
  }

  /**
   * Flush all pending writes to localStorage
   */
  private flushPendingWrites(): void {
    try {
      for (const [key, value] of this.pendingWrites) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      this.pendingWrites.clear();
      this.writeTimeout = null;
    } catch (error) {
      console.error('Error flushing pending writes:', error);
    }
  }

  /**
   * Force flush all pending writes immediately
   */
  flush(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    this.flushPendingWrites();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      const ttl = entry.ttl || this.DEFAULT_TTL;
      if (now - entry.timestamp >= ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const optimizedStorage = new OptimizedStorage();

// Cleanup expired cache entries periodically
setInterval(() => {
  optimizedStorage.cleanupExpiredCache();
}, 60000); // Every minute

// Flush pending writes before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    optimizedStorage.flush();
  });
}

// Export utility functions for backward compatibility
export const getStorageItem = <T>(key: string, defaultValue?: T): T | null => {
  return optimizedStorage.getItem(key, defaultValue);
};

export const setStorageItem = <T>(key: string, value: T, immediate = false): void => {
  optimizedStorage.setItem(key, value, immediate);
};

export const removeStorageItem = (key: string): void => {
  optimizedStorage.removeItem(key);
};

export const clearStorageCache = (): void => {
  optimizedStorage.clearCache();
};

export default optimizedStorage;