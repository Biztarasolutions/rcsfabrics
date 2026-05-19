import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Create cache with 10-minute TTL
export const cache = new NodeCache({ stdTTL: 600 });

/**
 * Middleware to cache GET requests
 * Cache key is built from method + URL + query string
 */
export const cacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Build cache key from URL and query
  const key = `${req.originalUrl || req.url}`;

  // Try to get from cache
  const cachedResponse = cache.get(key);
  if (cachedResponse) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedResponse);
  }

  // Intercept res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    // Only cache successful responses
    if (res.statusCode === 200) {
      cache.set(key, data);
      res.set('X-Cache', 'MISS');
    }
    return originalJson(data);
  };

  next();
};

/**
 * Clear cache for a specific pattern
 */
export const invalidateCache = (pattern?: string) => {
  if (!pattern) {
    cache.flushAll();
    return;
  }

  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

/**
 * Clear cache when data is modified
 */
export const invalidateCachePatterns = (patterns: string[]) => {
  patterns.forEach((pattern) => invalidateCache(pattern));
};
