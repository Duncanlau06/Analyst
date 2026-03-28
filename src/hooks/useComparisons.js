import { useState, useCallback } from 'react';

export function useComparisons() {
  const [comparisons, setComparisons] = useState([]);

  const addComparison = useCallback((comp) => {
    setComparisons((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, { ...comp, id: Date.now().toString(), status: 'idle', results: null }];
    });
  }, []);

  const removeComparison = useCallback((id) => {
    setComparisons((prev) => prev.filter(c => c.id !== id));
  }, []);

  const updateComparisonResult = useCallback((id, updates) => {
    setComparisons((prev) => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, []);

  return {
    comparisons,
    addComparison,
    removeComparison,
    updateComparisonResult
  };
}
