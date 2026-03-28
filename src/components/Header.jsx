import React from 'react';

const Header = ({ isRunning, lastRun }) => {
  return (
    <header className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', background: 'linear-gradient(to right, var(--accent-blue), var(--accent-red))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          EV Intelligence Dashboard
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Powered by TinyFish AI Agent
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {lastRun && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Last scan: {new Date(lastRun).toLocaleTimeString()}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: isRunning ? 'var(--accent-amber)' : 'var(--accent-green)',
            boxShadow: `0 0 10px ${isRunning ? 'var(--accent-amber)' : 'var(--accent-green)'}`,
            animation: isRunning ? 'pulse 1.5s infinite' : 'none'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            {isRunning ? 'Pipeline Scanning...' : 'System Ready'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </header>
  );
};

export default Header;
