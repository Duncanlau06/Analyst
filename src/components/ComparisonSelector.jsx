
import React, { useState } from 'react';

const fallbackColors = ['#00d4ff', '#ff3366', '#00ff88', '#f59e0b', '#6366f1', '#ef4444'];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'option';
}

function cleanOptionLabel(value) {
  return value
    .replace(/^(which|what|who)\s+(is|are)\s+(better|best)\s+(for|between)\s+/i, '')
    .replace(/^(which|what|who)\s+(is|are)\s+(better|best)\s+/i, '')
    .replace(/^for\s+[^:]+:\s*/i, '')
    .replace(/^between\s+/i, '')
    .replace(/^(compare|comparing)\s+/i, '')
    .replace(/^choose\s+/i, '')
    .replace(/^decide\s+between\s+/i, '')
    .replace(/^looking\s+at\s+/i, '')
    .replace(/^i(?:'d| would)?\s+pick\s+/i, '')
    .replace(/^should\s+i\s+(?:choose|pick|get)\s+/i, '')
    .replace(/^help\s+me\s+(?:choose|pick|compare)\s+/i, '')
    .replace(/^(an?|the)\s+/i, '')
    .replace(/\?+$/g, '')
    .replace(/^[\s:;,-]+|[\s:;,-]+$/g, '')
    .trim();
}

function parseOptionsFromQuery(query) {
  const normalizedQuery = query.trim();

  const candidatePatterns = [
    /(?:^|:)\s*(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i,
    /(?:^|:)\s*(.+?)\s+or\s+(.+)$/i,
    /between\s+(.+?)\s+and\s+(.+)$/i,
    /compare\s+(.+?)\s+(?:vs\.?|versus|and)\s+(.+)$/i,
    /(?:choose|pick|get)\s+(.+?)\s+or\s+(.+)$/i,
  ];

  for (const pattern of candidatePatterns) {
    const match = normalizedQuery.match(pattern);
    if (!match) {
      continue;
    }

    const leftName = cleanOptionLabel(match[1]);
    const rightName = cleanOptionLabel(match[2]);

    if (leftName && rightName) {
      return [leftName, rightName];
    }
  }

  const colonIndex = normalizedQuery.lastIndexOf(':');
  if (colonIndex !== -1) {
    return parseOptionsFromQuery(normalizedQuery.slice(colonIndex + 1));
  }

  const sentenceFragments = normalizedQuery
    .split(/[.?!]/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  for (const fragment of sentenceFragments) {
    if (fragment !== normalizedQuery) {
      const parsed = parseOptionsFromQuery(fragment);
      if (parsed.length === 2) {
        return parsed;
      }
    }
  }

  return [];
}

const inferOptionsFromQuery = (query) => {
  return [{ name: '' }, { name: '' }];
};

const ComparisonSelector = ({ onAdd, activeCount }) => {
  const [leftValue, setLeftValue] = useState('');
  const [rightValue, setRightValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(null); // 'left' or 'right'

  const isDuplicate = leftValue.trim() && rightValue.trim() && leftValue.trim().toLowerCase() === rightValue.trim().toLowerCase();
  const canAdd = activeCount < 3 && leftValue.trim() && rightValue.trim() && !isDuplicate;
  
  const handleAdd = () => {
    if (!canAdd) return;

    const lName = leftValue.trim();
    const rName = rightValue.trim();

    const leftOption = {
      id: lName.toLowerCase().replace(/\s+/g, '-'),
      name: lName,
      color: '#00d4ff'
    };

    const rightOption = {
      id: rName.toLowerCase().replace(/\s+/g, '-'),
      name: rName,
      color: '#ff3366'
    };

    // Auto-generate query from options
    const autoQuery = `What is better: ${lName} or ${rName}?`;

    onAdd({
      query: autoQuery,
      leftOption,
      rightOption
    });

    setLeftValue('');
    setRightValue('');
  };

  const [leftSuggestions, setLeftSuggestions] = useState([]);
  const [rightSuggestions, setRightSuggestions] = useState([]);

  React.useEffect(() => {
    const fetchSuggest = async (val, setter) => {
      if (val.length < 2) {
        setter([]);
        return;
      }
      
      try {
        const resp = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: val })
        });
        const web = await resp.json();
        const suggestionsArray = Array.isArray(web) ? web : [];
        
        // Include user's typed value at the top if it's not already in the list
        const typedLower = val.toLowerCase();
        const hasTyped = suggestionsArray.some(w => w.toLowerCase() === typedLower);
        const finalList = hasTyped ? suggestionsArray : [val, ...suggestionsArray];
        
        const combined = finalList.map(w => ({ name: w, type: hasTyped || w !== val ? 'Suggested' : 'Your input' }));
        setter(combined.slice(0, 6));
      } catch (e) {
        setter([]);
      }
    };

    const timer = setTimeout(() => {
      if (activeSearch === 'left') fetchSuggest(leftValue, setLeftSuggestions);
      if (activeSearch === 'right') fetchSuggest(rightValue, setRightSuggestions);
    }, 200);

    return () => clearTimeout(timer);
  }, [leftValue, rightValue, activeSearch]);

  return (
    <section className="hero-panel">
      <div className="composer-card">
        <p className="eyebrow">Product Comparison Analyst</p>

        <div className="selector-row">
          <div className="selector-block" style={{ position: 'relative' }}>
            <label className="field-label" htmlFor="left-option">Left option</label>
            <input
              id="left-option"
              value={leftValue}
              onChange={(event) => {
                const val = event.target.value;
                const parsed = parseOptionsFromQuery(val);
                if (parsed.length === 2 && !rightValue) {
                  setLeftValue(parsed[0]);
                  setRightValue(parsed[1]);
                } else {
                  setLeftValue(val);
                }
              }}
              onFocus={() => setActiveSearch('left')}
              onBlur={() => setTimeout(() => setActiveSearch(null), 200)}
              className="hero-input"
              style={{ minHeight: 'auto', borderRadius: '14px' }}
              placeholder="Auto-detect or search..."
              autoComplete="off"
            />
            {activeSearch === 'left' && leftSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {leftSuggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    className="suggestion-item"
                    onClick={() => { setLeftValue(s.name); setActiveSearch(null); }}
                  >
                    <span>{s.name}</span>
                    <span className="suggestion-meta">{s.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="selector-block" style={{ position: 'relative' }}>
            <label className="field-label" htmlFor="right-option">Right option</label>
            <input
              id="right-option"
              value={rightValue}
              onChange={(event) => {
                const val = event.target.value;
                const parsed = parseOptionsFromQuery(val);
                if (parsed.length === 2 && !leftValue) {
                  setLeftValue(parsed[0]);
                  setRightValue(parsed[1]);
                } else {
                  setRightValue(val);
                }
              }}
              onFocus={() => setActiveSearch('right')}
              onBlur={() => setTimeout(() => setActiveSearch(null), 200)}
              className="hero-input"
              style={{ minHeight: 'auto', borderRadius: '14px' }}
              placeholder="Auto-detect or search..."
              autoComplete="off"
            />
            {activeSearch === 'right' && rightSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {rightSuggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    className="suggestion-item"
                    onClick={() => { setRightValue(s.name); setActiveSearch(null); }}
                  >
                    <span>{s.name}</span>
                    <span className="suggestion-meta">{s.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isDuplicate && (
          <div style={{ color: '#ff3366', fontSize: '0.85rem', marginTop: '8px' }}>
            Left and right options cannot be the same.
          </div>
        )}

        <div className="composer-footer">
          <div className="composer-note">Outputs a winner bar, recommendation, confidence, and reasons for both sides.</div>
          <button onClick={handleAdd} disabled={!canAdd} className="primary-button">
            Add
          </button>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSelector;
