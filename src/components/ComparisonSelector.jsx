import React, { useState } from 'react';
import { companies } from '../config/companies';

const ComparisonSelector = ({ onAdd, activeCount }) => {
  const [query, setQuery] = useState('');
  const [compA, setCompA] = useState('');
  const [compB, setCompB] = useState('');

  const handleAdd = () => {
    if (activeCount >= 3) return;
    
    let finalQuery = query;
    let finalA = companies.find(c => c.id === compA);
    let finalB = companies.find(c => c.id === compB);

    if (!finalA || !finalB) {
      // Very crude fallback if user only typed text
      finalA = companies.find(c => query.toLowerCase().includes(c.id)) || companies[0];
      finalB = companies.find(c => query.toLowerCase().includes(c.id) && c.id !== finalA.id) || companies[1];
    }
    
    if (!finalQuery) {
      finalQuery = `${finalA.name} vs ${finalB.name}`;
    }

    onAdd({
      query: finalQuery,
      companyA: finalA,
      companyB: finalB,
    });
    
    setQuery('');
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-muted)' }}>Comparison Engine (Max 3)</h3>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g. Tesla FSD vs NIO Battery Swap..."
          style={{
             flex: '1', minWidth: '250px', padding: '12px 16px', borderRadius: '8px',
             background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
             color: 'white', fontSize: '15px'
          }}
        />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={compA} onChange={(e) => setCompA(e.target.value)} style={selectStyle}>
            <option value="">Company A</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)' }}>vs</span>
          <select value={compB} onChange={(e) => setCompB(e.target.value)} style={selectStyle}>
            <option value="">Company B</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <button 
            onClick={handleAdd}
            disabled={activeCount >= 3}
            style={{
              padding: '12px 24px', borderRadius: '8px', cursor: activeCount >= 3 ? 'not-allowed' : 'pointer',
              background: activeCount >= 3 ? '#333' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-red))',
              color: 'white', border: 'none', fontWeight: 600, fontSize: '15px'
            }}
          >
            + Add 
          </button>
        </div>
      </div>
    </div>
  );
};

const selectStyle = {
  padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', 
  border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px',
  appearance: 'none', cursor: 'pointer', minWidth: '130px'
};

export default ComparisonSelector;
