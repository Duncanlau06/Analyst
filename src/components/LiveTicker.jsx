import React, { useEffect, useRef, useState } from 'react';

const LiveTicker = ({ items }) => {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !isHovered) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items, isHovered]);

  return (
    <div 
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '48px',
        background: 'rgba(0, 5, 15, 0.95)', borderTop: '1px solid #333',
        display: 'flex', alignItems: 'center', fontFamily: 'monospace',
        zIndex: 1000, padding: '0 24px', whiteSpace: 'nowrap', overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ color: 'var(--accent-amber)', fontWeight: 'bold', marginRight: '16px' }}>
        LIVE INTELLIGENCE ►
      </div>
      
      <div 
        ref={scrollRef}
        style={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: '32px',
          scrollBehavior: 'smooth', ...scrollerCSS
        }}
      >
        {items.map((item, idx) => (
          <span key={idx} style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: '#00ff88', marginRight: '6px' }}>
              [{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const scrollerCSS = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
};

export default LiveTicker;
