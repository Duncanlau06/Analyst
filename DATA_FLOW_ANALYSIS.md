# Comparison Data Display - Data Flow Analysis

## 🐛 CRITICAL BUG FOUND: Double-Nesting of Results Object

### The Problem
The comparison data is not displaying because the results object is being incorrectly wrapped in production mode, creating a mismatch between how data flows in mock mode versus production mode.

---

## Data Flow Trace

### 1. Frontend: App.jsx
**File:** [src/App.jsx](src/App.jsx)
- Calls `runPipeline(comparisons)` with array of comparisons
- Each comparison has: `id, status, leftOption, rightOption, query, companyA, companyB`
- Results are rendered in `TugOfWarBar` component

### 2. Hook: usePipeline.js
**File:** [src/hooks/usePipeline.js](src/hooks/usePipeline.js)
**Line 20-80:** Where the bug occurs

#### Mock Mode (works correctly):
```javascript
const results = generateMockResult(query, comp.companyA, comp.companyB);
updateComparisonResult(comp.id, { status: 'complete', results });
```
- `results` = `{ left, right, winner, comparison_summary, confidence }`
- Stored directly with correct structure

#### Production Mode (BROKEN):
```javascript
const analysisData = await fetch('/api/comparisons/analyze', ...).json();
const results = {
  comparisonId: analysisData.comparisonId,
  query: analysisData.query,
  results: analysisData.results,  // ❌ NESTED HERE!
  evidence: analysisData.evidence,
  comments: analysisData.comments,
  sourceResults: analysisData.sourceResults,
  meta: analysisData.meta
};
updateComparisonResult(comp.id, { status: 'complete', results });
```
- `results` = `{ comparisonId, query, results: { left, right, ... }, evidence, ... }`
- **The actual comparison data is nested one level too deep**

### 3. Hook: useComparisons.js
**File:** [src/hooks/useComparisons.js](src/hooks/useComparisons.js)

Updates store with:
```typescript
{ 
  ...c, 
  ...updates // { status: 'complete', results }
}
```

Resulting comparison object:
- **Mock mode:** `{ id, leftOption, rightOption, query, status, results: { left, right, winner, ... } }`
- **Production mode:** `{ id, leftOption, rightOption, query, status, results: { comparisonId, query, results: { left, right, winner, ... }, ... } }`

### 4. Component: TugOfWarBar.jsx
**File:** [src/components/TugOfWarBar.jsx](src/components/TugOfWarBar.jsx)
**Line 29-30:**

```javascript
const leftData = results?.left || { name: leftOption.name, score: 50, reason: 'Awaiting analysis.' };
const rightData = results?.right || { name: rightOption.name, score: 50, reason: 'Awaiting analysis.' };
const winner = results?.winner || 'tie';
const summary = results?.comparison_summary || 'Run the analysis to generate a recommendation.';
const confidence = results?.confidence;
```

**Expected structure:** 
```javascript
results = {
  left: { name, score, reason },
  right: { name, score, reason },
  winner: 'left' | 'right' | 'tie',
  comparison_summary: string,
  confidence: number
}
```

**Actual structure (production mode):**
```javascript
results = {
  comparisonId: string,
  query: string,
  results: {  // ❌ One level too deep
    left: { name, score, reason },
    right: { name, score, reason },
    winner: 'left' | 'right' | 'tie',
    comparison_summary: string,
    confidence: number
  },
  evidence: array,
  comments: array,
  sourceResults: array,
  meta: object
}
```

**Result:** All queries return undefined:
- `results?.left` → undefined (should be `results?.results?.left`)
- `results?.winner` → undefined (should be `results?.results?.winner`)
- Falls back to default values from UI
- Data appears blank/not analyzed

---

## Backend Response Format

### [Backend: comparison-orchestrator.service.js](../backend/src/services/comparison-orchestrator.service.js)
**Line 281-318:** Response structure

The backend returns (correctly formatted):
```javascript
{
  comparisonId: string,
  query: string,
  companyA: object,
  companyB: object,
  leftOption: object,
  rightOption: object,
  results: {                    // ✅ Formatted by formatComparisonResultForFrontend
    left: { id, name, score, reason },
    right: { id, name, score, reason },
    winner: 'left' | 'right' | 'tie',
    comparison_summary: string,
    confidence: number
  },
  rawResult: object,            // Raw sentiment analysis
  comments: array,
  evidence: array,
  sourceResults: array,
  timeline: array,
  meta: object
}
```

### formatComparisonResultForFrontend
**File:** [../backend/src/services/scoring.service.js](../backend/src/services/scoring.service.js)
**Lines 150-195**

Correctly formats results with `left`, `right`, `winner`, `comparison_summary`, `confidence` properties.

---

## Root Cause Summary

**Mock mode:** Results stored correctly at `comparison.results`
**Production mode:** Results nested at `comparison.results.results` due to wrapper object in usePipeline.js

The wrapper object in production mode was likely intended to preserve additional API data (comparisonId, evidence, etc.) but breaks the UI contract that expects results at the top level.

---

## ✅ Fix Applied

### Location
[src/hooks/usePipeline.js](src/hooks/usePipeline.js) - Production mode code path

### The Fix
Changed from double-nesting the results to directly passing the formatted results:

**Before (BROKEN):**
```javascript
const results = {
  comparisonId: analysisData.comparisonId,
  query: analysisData.query,
  results: analysisData.results,    // ❌ Nesting the results
  evidence: analysisData.evidence,
  comments: analysisData.comments,
  sourceResults: analysisData.sourceResults,
  meta: analysisData.meta
};
updateComparisonResult(comp.id, { status: 'complete', results });
```

**After (FIXED):**
```javascript
// Pass formatted results directly - backend already returns results in correct structure:
// { left, right, winner, comparison_summary, confidence }
updateComparisonResult(comp.id, { status: 'complete', results: analysisData.results });
```

### Why This Works
1. The backend's `formatComparisonResultForFrontend()` already formats the data correctly
2. The formatted `analysisData.results` object has the exact structure TugOfWarBar expects
3. Mock mode stores results at the same level, so now both modes are consistent
4. This aligns with how the UI component destructures and reads the data

### Data Structure After Fix
```javascript
comparison = {
  id: string,
  status: 'complete',
  leftOption: object,
  rightOption: object,
  query: string,
  results: {              // ✅ Correct level
    left: { name, score, reason },
    right: { name, score, reason },
    winner: 'left' | 'right' | 'tie',
    comparison_summary: string,
    confidence: number
  }
}
```

### What Gets Displayed Now
- ✅ Left option name and score
- ✅ Right option name and score  
- ✅ Winner indicator
- ✅ Comparison summary
- ✅ Confidence percentage
- ✅ Tooltips with detailed reasons

