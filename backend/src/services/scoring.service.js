function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function computeMentionScore(text, companyName) {
  const normalizedText = text.toLowerCase();
  const normalizedCompany = companyName.toLowerCase();
  const positiveWords = ['growth', 'record', 'innovative', 'leading', 'strong', 'profit', 'wins', 'popular', 'efficient'];
  const negativeWords = ['recall', 'lawsuit', 'delay', 'loss', 'weak', 'risk', 'pressure', 'decline', 'expensive'];

  let score = 0;
  if (normalizedText.includes(normalizedCompany)) {
    score += 0.1;
  }

  for (const word of positiveWords) {
    if (normalizedText.includes(word)) {
      score += 0.08;
    }
  }

  for (const word of negativeWords) {
    if (normalizedText.includes(word)) {
      score -= 0.08;
    }
  }

  return clamp(0.5 + score);
}

export function buildHeuristicComparisonResult({ companyA, companyB, evidence }) {
  const evidenceText = evidence
    .map((item) => [item.title, item.summary, item.text].filter(Boolean).join(' '))
    .join(' ');

  const scoreA = computeMentionScore(evidenceText, companyA.name);
  const scoreB = computeMentionScore(evidenceText, companyB.name);

  return {
    [companyA.id]: {
      sentiment: Number(scoreA.toFixed(2)),
      confidence: 0.66,
      key_reason: `Heuristic score based on current scraped evidence mentioning ${companyA.name}.`,
    },
    [companyB.id]: {
      sentiment: Number(scoreB.toFixed(2)),
      confidence: 0.66,
      key_reason: `Heuristic score based on current scraped evidence mentioning ${companyB.name}.`,
    },
    summary: {
      winner: scoreA === scoreB ? 'tie' : scoreA > scoreB ? companyA.id : companyB.id,
      overview: `Fallback sentiment generated from scraped articles and comments for ${companyA.name} versus ${companyB.name}.`,
    },
  };
}
