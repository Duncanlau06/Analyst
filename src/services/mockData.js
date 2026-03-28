export const generateMockResult = (query, companyA, companyB) => {
  const getMockScore = (baseScore) => Math.min(1, Math.max(0, baseScore + (Math.random() * 0.2 - 0.1)));
  
  const reasonsA = [
    `Strong demand expected for the ${companyA.name} product pipeline.`,
    `${companyA.name} maintains technological lead in recent software update.`,
    `Aggressive pricing strategy secures market share for ${companyA.name}.`,
    `Analysts praise ${companyA.name} supply chain efficiency.`
  ];
  
  const reasonsB = [
    `${companyB.name} sees explosive growth in domestic market.`,
    `New battery technology provides ${companyB.name} a competitive edge.`,
    `${companyB.name} surpasses delivery estimates for Q3.`,
    `Global expansion plans position ${companyB.name} well against rivals.`
  ];

  // Randomly favor one more than the other slightly based on hash of query, to keep it somewhat consistent
  const favoredA = Math.random() > 0.5;

  return {
    [companyA.id]: {
      sentiment: getMockScore(favoredA ? 0.75 : 0.45),
      confidence: getMockScore(0.8),
      key_reason: reasonsA[Math.floor(Math.random() * reasonsA.length)]
    },
    [companyB.id]: {
      sentiment: getMockScore(favoredA ? 0.45 : 0.75),
      confidence: getMockScore(0.85),
      key_reason: reasonsB[Math.floor(Math.random() * reasonsB.length)]
    }
  };
};

export const getMockTickerData = (query) => {
  const mockInsights = [
    `Found article on Electrek: "${query} battle heats up..."`,
    `Analyzing Yahoo Finance comments matching '${query}'...`,
    `Extracting data from TechCrunch breakdown...`,
    `Google News snippet: "Comparing sales figures for 2026..."`,
    `Processing sentiment key factors...`
  ];
  return mockInsights[Math.floor(Math.random() * mockInsights.length)];
};
