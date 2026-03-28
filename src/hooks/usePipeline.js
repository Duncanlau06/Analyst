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
          // Actual backend call
          addTickerItem(`Live scraping via TinyFish for: ${query}`);
          const scrapeResp = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://news.google.com', goal: `Search for ${query} and return top articles.` })
          });

          if (!scrapeResp.ok) throw new Error('Scrape failed');
          const scrapeData = await scrapeResp.json();
          addTickerItem(`Scraped data received. Running sentiment engine...`);

          const extractedText = JSON.stringify(scrapeData.result);

          // Call sentiment endpoint
          const sentResp = await fetch('/api/sentiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText, companyA: comp.companyA.name, companyB: comp.companyB.name })
          });

          let results;
          if (sentResp.ok) {
            results = await sentResp.json();
            addTickerItem(`OpenAI sentiment scoring successful for ${query}`);
          } else {
            addTickerItem(`OpenAI API failed. Falling back to heuristic engine for ${query}.`);
            results = analyzeSentimentHeuristic(extractedText, comp.companyA.name, comp.companyB.name);
          }

          updateComparisonResult(comp.id, { status: 'complete', results });
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
