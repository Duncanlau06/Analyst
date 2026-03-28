class ComparisonStore {
  constructor() {
    this.store = new Map();
  }

  save(comparisonId, payload) {
    this.store.set(comparisonId, payload);
    return payload;
  }

  get(comparisonId) {
    return this.store.get(comparisonId) || null;
  }
}

export const comparisonStore = new ComparisonStore();
