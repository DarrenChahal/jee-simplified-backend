import { LRUCache } from 'lru-cache';

// Create LRU cache for admin status
// Cache up to 1000 entries, each with a TTL of 5 minutes
const adminCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

export default adminCache;
