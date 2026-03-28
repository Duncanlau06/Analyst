export const generateMockResult = (query, leftOption, rightOption) => {
  const getMockScore = (baseScore) => Math.min(1, Math.max(0, baseScore + (Math.random() * 0.2 - 0.1)));
  
  const reasonsA = [
    `Strong demand expected for the ${leftOption.name} product pipeline.`,
    `${leftOption.name} maintains technological lead in recent software update.`,
    `Aggressive pricing strategy secures market share for ${leftOption.name}.`,
    `Analysts praise ${leftOption.name} supply chain efficiency.`
  ];
  
  const reasonsB = [
    `${rightOption.name} sees explosive growth in domestic market.`,
    `New battery technology provides ${rightOption.name} a competitive edge.`,
    `${rightOption.name} surpasses delivery estimates for Q3.`,
    `Global expansion plans position ${rightOption.name} well against rivals.`
  ];

  // Randomly favor one more than the other slightly based on hash of query, to keep it somewhat consistent
  const favoredA = Math.random() > 0.5;
  const leftScore = getMockScore(favoredA ? 0.75 : 0.45);
  const rightScore = getMockScore(favoredA ? 0.45 : 0.75);

  return {
    left: {
      id: leftOption.id,
      name: leftOption.name,
      score: Math.round(leftScore * 100),
      reason: reasonsA[Math.floor(Math.random() * reasonsA.length)]
    },
    right: {
      id: rightOption.id,
      name: rightOption.name,
      score: Math.round(rightScore * 100),
      reason: reasonsB[Math.floor(Math.random() * reasonsB.length)]
    },
    winner: favoredA ? 'left' : 'right',
    comparison_summary: favoredA
      ? `${leftOption.name} looks like the stronger fit for "${query}" based on momentum, pricing, and execution signals.`
      : `${rightOption.name} looks like the stronger fit for "${query}" based on momentum, pricing, and execution signals.`,
    confidence: getMockScore(0.82)
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
