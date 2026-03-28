import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ComparisonSelector from './components/ComparisonSelector';
import TugOfWarBar from './components/TugOfWarBar';
import { useComparisons } from './hooks/useComparisons';
import { usePipeline } from './hooks/usePipeline';

function App() {
  const { comparisons, addComparison, removeComparison, updateComparisonResult } = useComparisons();
  const [lastRun, setLastRun] = useState(null);

  const addTickerItem = (msg) => {
    // Ticker removed, no-op
  };

  const { runPipeline, isRunning } = usePipeline(updateComparisonResult, addTickerItem);

  const handleRun = () => {
    runPipeline(comparisons);
    setLastRun(new Date());
  };

  return (
    <div style={{ paddingBottom: '64px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header isRunning={isRunning} lastRun={lastRun} activeCount={comparisons.length} />

      <main style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '0 20px', flex: 1 }}>
        <ComparisonSelector onAdd={addComparison} activeCount={comparisons.length} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '36px' }}>

          
          <button
            onClick={handleRun}
            disabled={isRunning || comparisons.length === 0}
            style={{
              padding: '12px 24px', borderRadius: '8px', cursor: (isRunning || comparisons.length === 0) ? 'not-allowed' : 'pointer',
              background: (isRunning || comparisons.length === 0) ? '#333' : 'linear-gradient(135deg, #00d4ff, #ff3366)',
              color: 'white', border: 'none', fontWeight: 600, fontSize: '15px',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            {isRunning ? 'Scanning...' : 'Run Pipeline'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {comparisons.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active comparisons. Add one above to begin.
            </div>
          ) : (
            comparisons.map(comp => (
              <TugOfWarBar key={comp.id} comparison={comp} onRemove={() => removeComparison(comp.id)} />
            ))
          )}
        </div>
      </main>

    </div>
  );
}

export default App;
