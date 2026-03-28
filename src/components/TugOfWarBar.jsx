import React, { useState } from 'react';

const Tooltip = ({ data, children }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <div 
      style={{ position: 'relative', display: 'flex', flex: 1, height: '100%', alignItems: 'center' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover && data && (
        <div style={{
          position: 'absolute', top: '-110%', left: '50%', transform: 'translateX(-50%)',
          width: 'max-content', maxWidth: '280px',
          background: 'rgba(5, 10, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '8px', zIndex: 100,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Sentiment: <span style={{color: 'white'}}>{(data.sentiment * 100).toFixed(1)}%</span> | 
            Confidence: <span style={{color: 'white'}}>{(data.confidence * 100).toFixed(1)}%</span>
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.4, color: 'white' }}>
            {data.key_reason}
          </div>
        </div>
      )}
    </div>
  );
};

const TugOfWarBar = ({ comparison, onRemove }) => {
  const { query, companyA, companyB, results, status } = comparison;
  
  // Defaults if no result yet
  const sentA = results ? results[companyA.id]?.sentiment || 0.5 : 0.5;
  const sentB = results ? results[companyB.id]?.sentiment || 0.5 : 0.5;
  const total = sentA + sentB;
  const widthA = total > 0 ? (sentA / total) * 100 : 50;
  const widthB = total > 0 ? (sentB / total) * 100 : 50;

  const colorA = companyA.color;
  const colorB = companyB.color;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px', position: 'relative' }}>
      <button 
        onClick={onRemove}
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px' }}
      >
        ✕
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: colorA }}>{companyA.name}</h2>
          {results && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{(sentA * 100).toFixed(0)}</span>}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{query}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {status === 'scanning' ? 'Agent Scanning...' : status === 'complete' ? 'Analysis Complete' : 'Ready'}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {results && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{(sentB * 100).toFixed(0)}</span>}
          <h2 style={{ margin: 0, fontSize: '20px', color: colorB }}>{companyB.name}</h2>
        </div>
      </div>

      <div style={{ 
        height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', 
        display: 'flex', overflow: 'hidden', position: 'relative',
        boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: `${widthA}%`, background: `linear-gradient(90deg, ${colorA}44, ${colorA})`,
          transition: 'width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {results && <Tooltip data={results[companyA.id]}><div style={{width:'100%', height:'100%'}}></div></Tooltip>}
        </div>
        
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.2)', zIndex: 10 }} />
        
        <div style={{
          width: `${widthB}%`, background: `linear-gradient(270deg, ${colorB}44, ${colorB})`,
          transition: 'width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
           {results && <Tooltip data={results[companyB.id]}><div style={{width:'100%', height:'100%'}}></div></Tooltip>}
        </div>
      </div>
    </div>
  );
};

export default TugOfWarBar;
