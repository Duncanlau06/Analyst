import React, { useMemo, useState } from 'react';
import { companies } from '../config/companies';

const inferOptionsFromQuery = (query) => {
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
