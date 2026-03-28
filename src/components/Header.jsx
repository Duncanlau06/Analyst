import React from 'react';

const Header = ({ isRunning, lastRun, activeCount }) => {
  return (
    <header className="top-shell">
      <div>
        <p className="eyebrow">Decision-ready AI comparison</p>
        <h2 className="top-title">Compare products with a bar that highlights the stronger fit.</h2>
      </div>

      <div className="status-cluster">
        <div className="status-pill">
          <span className={`status-dot ${isRunning ? 'running' : 'ready'}`} />
          <span>{isRunning ? 'Analyzing now' : 'Ready for analysis'}</span>
        </div>
        {lastRun && (
          <div className="status-meta">
            Last run {new Date(lastRun).toLocaleTimeString()}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
