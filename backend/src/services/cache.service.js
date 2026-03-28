import { env } from '../config/env.js';

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs = env.cacheTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }
}

export const cache = new MemoryCache();
