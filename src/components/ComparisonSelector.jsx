
import React, { useState } from 'react';

const inferOptionsFromQuery = (query) => {
  return [{ name: '' }, { name: '' }];
};

const ComparisonSelector = ({ onAdd, activeCount }) => {
  const [query, setQuery] = useState('');
  const [leftValue, setLeftValue] = useState('');
  const [rightValue, setRightValue] = useState('');
  const [activeSearch, setActiveSearch] = useState(null); // 'left' or 'right'

  const isDuplicate = leftValue.trim() && rightValue.trim() && leftValue.trim().toLowerCase() === rightValue.trim().toLowerCase();
  const canAdd = activeCount < 3 && query.trim() && query.length <= 500 && !isDuplicate;
  const handleAdd = () => {
    if (!canAdd) return;

    const [inferredLeft, inferredRight] = inferOptionsFromQuery(query);

    const lName = leftValue.trim() || inferredLeft.name;
    const rName = rightValue.trim() || inferredRight.name;

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

    onAdd({
      query: query.trim(),
      leftOption,
      rightOption
    });

    setQuery('');
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
        <label className="field-label" htmlFor="comparison-query">What should we analyze?</label>
        <textarea
          id="comparison-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Example: Which is better for a student designer on a budget, MacBook Air or Surface Laptop?"
          rows={4}
          className="hero-input"
        />
        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: query.length > 500 ? '#ff3366' : 'var(--text-muted)' }}>
          {query.length}/500 characters
        </div>

        <div className="selector-row">
          <div className="selector-block" style={{ position: 'relative' }}>
            <label className="field-label" htmlFor="left-option">Left option</label>
            <input
              id="left-option"
              value={leftValue}
              onChange={(event) => setLeftValue(event.target.value)}
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
              onChange={(event) => setRightValue(event.target.value)}
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
