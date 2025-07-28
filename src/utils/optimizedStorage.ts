/**
 * Optimized localStorage utility with debouncing and error handling
 */

interface StorageCache {
  [key: string]: {
    value: any;
    timestamp: number;
  };
}

class OptimizedStorage {
  private cache: StorageCache = {};
  private pendingWrites: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 300; // 300ms debounce
  private readonly CACHE_TTL = 5000; // 5 second cache TTL

  /**
   * Get item from localStorage with caching
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    // Check cache first
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }

      const parsed = JSON.parse(item);
      
      // Update cache
      this.cache[key] = {
        value: parsed,
        timestamp: Date.now()
      };

      return parsed;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item to localStorage with debouncing
   */
  setItem(key: string, value: any): void {
    // Update cache immediately for synchronous reads
    this.cache[key] = {
      value,
      timestamp: Date.now()
    };

    // Cancel any pending write for this key
    const existingTimeout = this.pendingWrites.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule debounced write
    const timeout = setTimeout(() => {
      this.performWrite(key, value);
      this.pendingWrites.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.pendingWrites.set(key, timeout);
  }

  /**
   * Set item immediately without debouncing (for critical data)
   */
  setItemImmediate(key: string, value: any): void {
    // Cancel any pending write
    const existingTimeout = this.pendingWrites.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.pendingWrites.delete(key);
    }

    // Update cache
    this.cache[key] = {
      value,
      timestamp: Date.now()
    };

    // Write immediately
    this.performWrite(key, value);
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    // Cancel any pending write
    const existingTimeout = this.pendingWrites.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.pendingWrites.delete(key);
    }

    // Remove from cache
    delete this.cache[key];

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
    }
  }

  /**
   * Clear all localStorage data
   */
  clear(): void {
    // Cancel all pending writes
    this.pendingWrites.forEach(timeout => clearTimeout(timeout));
    this.pendingWrites.clear();

    // Clear cache
    this.cache = {};

    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage', error);
    }
  }

  /**
   * Flush all pending writes immediately
   */
  flush(): void {
    this.pendingWrites.forEach((timeout, key) => {
      clearTimeout(timeout);
      const cached = this.cache[key];
      if (cached) {
        this.performWrite(key, cached.value);
      }
    });
    this.pendingWrites.clear();
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate available space (most browsers have ~5-10MB limit)
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      const available = Math.max(0, estimated - used);
      const percentage = (used / estimated) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.warn('Failed to get storage info', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Perform the actual write to localStorage
   */
  private performWrite(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Attempting cleanup...');
        this.performCleanup();
        
        // Try again after cleanup
        try {
          const serialized = JSON.stringify(value);
          localStorage.setItem(key, serialized);
        } catch (retryError) {
          console.error('Failed to save to localStorage even after cleanup', retryError);
        }
      } else {
        console.warn(`Failed to set item in localStorage: ${key}`, error);
      }
    }
  }

  /**
   * Perform cleanup when storage is full
   */
  private performCleanup(): void {
    try {
      // Remove old cache entries
      const now = Date.now();
      Object.keys(this.cache).forEach(key => {
        if (now - this.cache[key].timestamp > this.CACHE_TTL * 2) {
          delete this.cache[key];
        }
      });

      // Could implement more sophisticated cleanup strategies here
      // For now, just clear the cache
      console.log('Performed localStorage cleanup');
    } catch (error) {
      console.warn('Failed to perform cleanup', error);
    }
  }
}

// Create singleton instance
export const optimizedStorage = new OptimizedStorage();

// Flush pending writes before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    optimizedStorage.flush();
  });

  // Also flush periodically
  setInterval(() => {
    optimizedStorage.flush();
  }, 30000); // Every 30 seconds
}

export default optimizedStorage;