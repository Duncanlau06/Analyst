import React, { useEffect, useMemo, useRef } from 'react';

const LiveTicker = ({ items }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [items]);

  const renderedItems = useMemo(
    () =>
      items.map((item, index) => ({
        id: `${index}-${item}`,
        label: item,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })),
    [items]
  );

  return (
    <div className="ticker-shell">
      <div className="ticker-label">Live Analysis Feed</div>
      <div ref={scrollRef} className="ticker-track">
        {renderedItems.map((item) => (
          <span key={item.id} className="ticker-item">
            <span className="ticker-time">[{item.time}]</span>
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
