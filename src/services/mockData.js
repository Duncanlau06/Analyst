export const generateMockResult = (query, leftOption, rightOption) => {
  const getMockScore = (baseScore) => Math.min(1, Math.max(0, baseScore + (Math.random() * 0.2 - 0.1)));
  
  const reasonsA = [
    `Users say: "Strong demand expected for the ${leftOption.name} product pipeline."`,
    `Analysts report: "${leftOption.name} maintains technological lead in recent software update."`,
    `Investment community: "Aggressive pricing strategy secures market share for ${leftOption.name}."`,
    `Supply chain experts: "Analysts praise ${leftOption.name} supply chain efficiency."`
  ];
  
  const reasonsB = [
    `Users say: "${rightOption.name} sees explosive growth in domestic market."`,
    `Tech reviewers: "New battery technology provides ${rightOption.name} a competitive edge."`,
    `Delivery tracker data: "${rightOption.name} surpasses delivery estimates for Q3."`,
    `Expansion strategists: "Global expansion plans position ${rightOption.name} well against rivals."`
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
      reason: reasonsA[Math.floor(Math.random() * reasonsA.length)],
      source: ['users', 'analysts', 'investors', 'experts'][Math.floor(Math.random() * 4)]
    },
    right: {
      id: rightOption.id,
      name: rightOption.name,
      score: Math.round(rightScore * 100),
      reason: reasonsB[Math.floor(Math.random() * reasonsB.length)],
      source: ['users', 'reviewers', 'data', 'strategists'][Math.floor(Math.random() * 4)]
    },
    winner: favoredA ? 'left' : 'right',
    comparison_summary: favoredA
      ? `What people say about ${leftOption.name}: "${reasonsA[0].split(': ')[1]}". Meanwhile, opinions on ${rightOption.name}: "${reasonsB[0].split(': ')[1]}".`
      : `What people say about ${rightOption.name}: "${reasonsB[0].split(': ')[1]}". Meanwhile, opinions on ${leftOption.name}: "${reasonsA[0].split(': ')[1]}".`,
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
