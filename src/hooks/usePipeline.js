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

          const rawResults = generateMockResult(query, comp.companyA, comp.companyB);
          addTickerItem(`Sentiment analysis complete for ${query}`);

          // Transform raw results (keyed by id) into left/right format for TugOfWarBar
          const leftRaw = rawResults[comp.leftOption.id] || {};
          const rightRaw = rawResults[comp.rightOption.id] || {};
          const leftScore = Math.round((leftRaw.sentiment || 0.5) * 100);
          const rightScore = Math.round((rightRaw.sentiment || 0.5) * 100);

          const results = {
            left: {
              name: comp.leftOption.name,
              score: leftScore,
              reason: leftRaw.key_reason || 'No detailed reason available.'
            },
            right: {
              name: comp.rightOption.name,
              score: rightScore,
              reason: rightRaw.key_reason || 'No detailed reason available.'
            },
            winner: leftScore > rightScore ? 'left' : rightScore > leftScore ? 'right' : 'tie',
            confidence: (leftRaw.confidence + rightRaw.confidence) / 2,
            comparison_summary: leftScore > rightScore
              ? `${comp.leftOption.name} edges out ${comp.rightOption.name} with a stronger overall fit for this use case.`
              : rightScore > leftScore
              ? `${comp.rightOption.name} edges out ${comp.leftOption.name} with a stronger overall fit for this use case.`
              : `Both options are evenly matched for this use case.`
          };

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
