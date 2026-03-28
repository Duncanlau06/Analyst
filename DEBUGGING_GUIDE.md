# Debugging Guide: Data Structure Mismatch Issues

## Pattern Recognition

This bug is an example of a **Data Structure Mismatch** issue - where data is formatted correctly at the source but gets corrupted during transit/transformation, causing silent failures in consuming components.

### Common Characteristics of This Pattern

1. **Silent Failures** - No errors thrown, just wrong data displayed
2. **Inconsistent Behavior** - Works in some code paths (mock) but not others (production)  
3. **Fallback Values Displayed** - UI shows defaults instead of actual data
4. **No Console Errors** - Optional chaining (`?.`) prevents errors
5. **Works in Development** - Mock mode tests pass, production breaks

---

## Debugging Checklist for Similar Issues

When data isn't displaying in a React component:

### 1. Frontend Component First
- [ ] Log the exact prop/state being passed to component
- [ ] Verify expected properties exist: `console.log(data)`
- [ ] Check for optional chaining hiding issues: `data?.prop?.nested?.value`
- [ ] Verify conditional rendering isn't hiding data: `{data && <Component />}`

### 2. State Management Hook
- [ ] Log state after each state update: `console.log({ state })`
- [ ] Trace data through transformations
- [ ] Compare mock vs production code paths
- [ ] Verify spreads aren't unintentionally nesting data: `{ ...obj, nested: data }`

### 3. API Response
- [ ] Log raw response: `console.log('Response:', response)`
- [ ] Verify structure matches consumer expectations
- [ ] Check for double-wrapping: `{ data: { data: {...} } }`
- [ ] Use Network tab to inspect actual response payload

### 4. Hook Transformation
- [ ] Understand what the API returns
- [ ] Understand what the component expects
- [ ] Trace any intermediate transformations
- [ ] Ensure mock and production paths return same structure

---

## Tools for Debugging This Issue

### Browser DevTools

1. **React DevTools:**
   - Open Component Inspector
   - Navigate to TugOfWarBar component
   - Check "Props" tab to see actual comparison object
   - Expand `results` property - should show `left`, `right`, `winner`
   - If you see `results` → `results`, you've found the nesting issue

2. **Console:**
   ```javascript
   // In your component, add a debug log:
   const { comparison } = props;
   console.log('Full comparison:', comparison);
   console.log('Results at top level:', comparison.results);
   console.log('Left data:', comparison.results?.left);
   ```

3. **Network Tab:**
   - Find the `/api/comparisons/analyze` request
   - Click "Response" tab
   - Verify structure matches what you expect
   - Check if `response.results` contains `left`, `right`, etc.

### Adding Debug Logging

```javascript
// In usePipeline.js after API call
const analysisData = await analysisResp.json();
console.log('=== API Response ===');
console.log('Full response:', analysisData);
console.log('Results structure:', analysisData.results);
if (analysisData.results?.left) {
  console.log('✅ Correct structure detected');
  console.log('Left data:', analysisData.results.left);
} else {
  console.log('❌ Results not structured correctly');
}
```

```javascript
// In useComparisons after update
const [comparisons, setComparisons] = useState([]);
useEffect(() => {
  console.log('Comparisons updated:', comparisons);
  comparisons.forEach(c => {
    console.log(`Comparison ${c.id}:`, {
      status: c.status,
      hasResults: !!c.results,
      hasLeft: !!c.results?.left,
      resultsDepth: c.results?.results ? 'nested' : 'correct'
    });
  });
}, [comparisons]);
```

```javascript
// In TugOfWarBar.jsx to verify props
const TugOfWarBar = ({ comparison, onRemove }) => {
  useEffect(() => {
    console.log('TugOfWarBar received:', {
      status: comparison.status,
      query: comparison.query,
      results: comparison.results,
      expectingLeft: !!comparison.results?.left,
      expectingRight: !!comparison.results?.right
    });
  }, [comparison]);
  // ... rest of component
};
```

---

## Prevention Strategies

### 1. Types/Interfaces
Define and document expected data structures:

```typescript
// Add types.ts
interface ComparisonResult {
  left: { id: string; name: string; score: number; reason: string };
  right: { id: string; name: string; score: number; reason: string };
  winner: 'left' | 'right' | 'tie';
  comparison_summary: string;
  confidence: number;
}

interface Comparison {
  id: string;
  status: 'idle' | 'scanning' | 'complete' | 'error';
  results: ComparisonResult | null;
  // ... other fields
}
```

### 2. Validation Helper
Create a helper to validate and normalize data:

```javascript
// In a utils file
export function validateComparisonResults(data) {
  if (!data) return null;
  
  // Detect if accidentally nested
  if (data.results && data.results.left && !data.left) {
    console.warn('Results are double-nested, flattening...');
    return data.results;
  }
  
  // Validate required structure
  if (!data.left || !data.right) {
    throw new Error('Invalid results structure');
  }
  
  return data;
}

// Then use in hook:
updateComparisonResult(comp.id, { 
  status: 'complete', 
  results: validateComparisonResults(analysisData.results) 
});
```

### 3. Shared Transformation
Create a single place to transform API responses:

```javascript
// In a dedicated transformer file
export function transformApiResponse(apiData) {
  return {
    status: 'complete',
    results: apiData.results,  // Extract just the results
    // Optional: keep metadata at top level if needed
    metadata: {
      comparisonId: apiData.comparisonId,
      query: apiData.query,
      // ... other meta
    }
  };
}

// Use consistently
updateComparisonResult(comp.id, transformApiResponse(analysisData));
```

### 4. Unit Tests
Test data transformation logic:

```javascript
describe('usePipeline data transformation', () => {
  it('should pass results at correct nesting level', () => {
    const mockApiResponse = {
      comparisonId: 'cmp_123',
      results: {
        left: { name: 'A', score: 70 },
        right: { name: 'B', score: 30 },
        winner: 'left'
      }
    };
    
    const transformed = transformForUI(mockApiResponse);
    
    expect(transformed.results.left).toBeDefined();
    expect(transformed.results.results).toBeUndefined(); // Important: NOT nested
  });
});
```

---

## Quick Reference: What to Check

| Item | Expected | How to Verify |
|------|----------|---------------|
| API Response | `{ results: { left, right, winner, ... } }` | Network tab |
| usePipeline Pass | `{ status: 'complete', results: {...} }` | Add console.log before updateComparisonResult |
| useComparisons Store | `{ ...comp, results: {...} }` | React DevTools Props tab |
| TugOfWarBar Props | `comparison.results?.left` = defined | Component debug log |

If any one of these shows nested `results`, you've found the issue.

