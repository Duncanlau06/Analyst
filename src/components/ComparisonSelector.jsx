import React, { useMemo, useState } from 'react';
import { companies } from '../config/companies';

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
  const parsedOptions = parseOptionsFromQuery(query);
  if (parsedOptions.length === 2) {
    return parsedOptions.map((name, index) => ({
      id: slugify(name),
      name,
      color: fallbackColors[index % fallbackColors.length],
    }));
  }

  const matches = companies.filter((company) => query.toLowerCase().includes(company.name.toLowerCase()) || query.toLowerCase().includes(company.id));
  return [matches[0] || companies[0], matches[1] || companies[1]];
};

const toOption = (company) => ({
  id: company.id,
  name: company.name,
  color: company.color
});

const ComparisonSelector = ({ onAdd, activeCount }) => {
  const [query, setQuery] = useState('');
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  const canAdd = activeCount < 3 && query.trim();
  const helperText = useMemo(
    () => 'Ask for any product or use case, then optionally pin the two options you want compared.',
    []
  );

  const handleAdd = () => {
    if (!canAdd) return;

    const selectedLeft = companies.find((company) => company.id === leftId);
    const selectedRight = companies.find((company) => company.id === rightId);
    const [inferredLeft, inferredRight] = inferOptionsFromQuery(query);

    const leftOption = toOption(selectedLeft || inferredLeft);
    const rightOption = toOption(selectedRight || (inferredRight.id === leftOption.id ? companies.find((company) => company.id !== leftOption.id) || companies[1] : inferredRight));

    onAdd({
      query: query.trim(),
      leftOption,
      rightOption
    });

    setQuery('');
    setLeftId('');
    setRightId('');
  };

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Product Comparison Analyst</p>
        <h1>Turn AI output into a decision bar that shows which option fits the user&apos;s need better.</h1>
        <p className="hero-subtle">{helperText}</p>
      </div>

      <div className="composer-card">
        <label className="field-label" htmlFor="comparison-query">What should we analyze?</label>
        <textarea
          id="comparison-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Example: Which is better for a student designer on a budget, MacBook Air or Surface Laptop?"
          rows={4}
          className="hero-input"
        />

        <div className="selector-row">
          <div className="selector-block">
            <label className="field-label" htmlFor="left-option">Left option</label>
            <select id="left-option" value={leftId} onChange={(event) => setLeftId(event.target.value)} className="select-input">
              <option value="">Auto-detect from prompt</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div className="selector-block">
            <label className="field-label" htmlFor="right-option">Right option</label>
            <select id="right-option" value={rightId} onChange={(event) => setRightId(event.target.value)} className="select-input">
              <option value="">Auto-detect from prompt</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="composer-footer">
          <div className="composer-note">Outputs a winner bar, recommendation, confidence, and reasons for both sides.</div>
          <button onClick={handleAdd} disabled={!canAdd} className="primary-button">
            Add Comparison
          </button>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSelector;
