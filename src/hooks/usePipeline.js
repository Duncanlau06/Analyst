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
          addTickerItem(`Scraping EV News for ${leftOption.name} and ${rightOption.name}...`);
          await new Promise(r => setTimeout(r, 1000));
          addTickerItem(`Parsing Yahoo Finance comments...`);
          await new Promise(r => setTimeout(r, 800));
          addTickerItem(getMockTickerData(query));
          await new Promise(r => setTimeout(r, 1200));

          const results = generateMockResult(query, leftOption, rightOption);
          addTickerItem(`Sentiment analysis complete for ${query}`);
          
          updateComparisonResult(comp.id, { status: 'complete', results });
        } else {
          addTickerItem(`Live backend analysis started for: ${query}`);

          const analysisResp = await fetch('/api/comparisons/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              leftOption,
              rightOption,
              companyA: leftOption,
              companyB: rightOption,
              includeComments: true,
              sources: ['news', 'financial', 'social']
            })
          });

          if (!analysisResp.ok) {
            const errorBody = await analysisResp.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Comparison analysis failed');
          }

          const analysis = await analysisResp.json();
          analysis.timeline?.forEach(item => addTickerItem(item));
          if (analysis.meta?.partial) {
            addTickerItem(
              `Analysis completed with partial results: ${analysis.meta?.successfulSources || 0} sources succeeded, ${analysis.meta?.timedOutSources || 0} timed out, ${analysis.meta?.failedSources || 0} failed`
            );
          } else {
            addTickerItem(`Analysis complete with ${analysis.meta?.sourcesUsed || 0} evidence items`);
          }
          if ((analysis.meta?.sourcesUsed || 0) === 0) {
            addTickerItem('No usable evidence was collected. Try a broader query or run the TinyFish smoke test route.');
          }
          addTickerItem(`Backend runtime: ${analysis.meta?.durationMs || 0}ms`);

          updateComparisonResult(comp.id, {
            status: 'complete',
            results: analysis.results,
            comments: analysis.comments,
            evidence: analysis.evidence,
            sourceResults: analysis.sourceResults,
            backendMeta: analysis.meta,
            comparisonRunId: analysis.comparisonId
          });
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
