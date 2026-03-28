import { useState, useCallback } from 'react';
import { generateMockResult, getMockTickerData } from '../services/mockData';

export function usePipeline(updateComparisonResult, addTickerItem) {
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(async (comparisons, useMock = import.meta.env.VITE_MOCK_MODE === 'true') => {
    if (comparisons.length === 0) return;
    setIsRunning(true);

    // Set all to scanning
    comparisons.forEach(c => updateComparisonResult(c.id, { status: 'scanning' }));

    for (const comp of comparisons) {
      if (comp.status === 'complete') continue;

      const query = comp.query;
      const leftOption = comp.leftOption;
      const rightOption = comp.rightOption;
      addTickerItem(`Initiating pipeline for: ${query}`);

      try {
        if (useMock || import.meta.env.VITE_MOCK_MODE === 'true') {
          // Simulate latency
          addTickerItem(`Scraping EV News for ${comp.companyA.name} and ${comp.companyB.name}...`);
          await new Promise(r => setTimeout(r, 1000));
          addTickerItem(`Parsing Yahoo Finance comments...`);
          await new Promise(r => setTimeout(r, 800));
          addTickerItem(getMockTickerData(query));
          await new Promise(r => setTimeout(r, 1200));

          const results = generateMockResult(query, comp.companyA, comp.companyB);
          addTickerItem(`Sentiment analysis complete for ${query}`);

          updateComparisonResult(comp.id, { status: 'complete', results });
        } else {
          // Advanced backend call with full analysis
          addTickerItem(`Starting analysis pipeline for: ${query}`);
          
          const analysisResp = await fetch('/api/comparisons/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              companyA: comp.companyA,
              companyB: comp.companyB,
              leftOption: leftOption,
              rightOption: rightOption,
              includeComments: true,
              sources: ['news', 'financial', 'social']
            })
          });

          if (!analysisResp.ok) {
            throw new Error(`Analysis failed: ${analysisResp.statusText}`);
          }
          
          const analysisData = await analysisResp.json();
          addTickerItem(`Analysis complete for ${query}`);
          
          // Pass formatted results directly - backend already returns results in correct structure:
          // { left, right, winner, comparison_summary, confidence }
          updateComparisonResult(comp.id, { status: 'complete', results: analysisData.results });
        }
      } catch (err) {
        addTickerItem(`Error in pipeline for ${query}: ${err.message}`);
        updateComparisonResult(comp.id, { status: 'error' });
      }
    }

    setIsRunning(false);
  }, [updateComparisonResult, addTickerItem]);

  return { runPipeline, isRunning };
}
