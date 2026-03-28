function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeConfidence(value, fallback = 0.5) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return clamp(numericValue);
  }

  return fallback;
}

function normalizeSentiment(value, fallback = 0.5) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return clamp(numericValue);
  }

  return fallback;
}

function sentimentToScore(value) {
  return Math.round(normalizeSentiment(value) * 100);
}

function normalizeFrontendScore(value, fallback = 50) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  if (numericValue >= 0 && numericValue <= 1) {
    return Math.round(numericValue * 100);
  }

  return Math.round(clamp(numericValue, 0, 100));
}

function normalizeFrontendWinner(value, companyA, companyB) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'left' || normalized === companyA.id.toLowerCase()) {
    return 'left';
  }
  if (normalized === 'right' || normalized === companyB.id.toLowerCase()) {
    return 'right';
  }
  return 'tie';
}

function computeMentionScore(text, companyName) {
  const normalizedText = text.toLowerCase();
  const normalizedCompany = companyName.toLowerCase();
  const positiveWords = ['growth', 'record', 'innovative', 'leading', 'strong', 'profit', 'wins', 'popular', 'efficient', 'premium', 'excellent', 'best', 'outperform', 'surge', 'gain', 'achieve', 'succeed'];
  const negativeWords = ['recall', 'lawsuit', 'delay', 'loss', 'weak', 'risk', 'pressure', 'decline', 'expensive', 'costly', 'failure', 'poor', 'worst', 'problem', 'issue', 'concern', 'complaint'];

  let score = 0;
  let mentionCount = 0;
  
  // Count company mentions
  const mentionRegex = new RegExp(normalizedCompany, 'g');
  mentionCount = (normalizedText.match(mentionRegex) || []).length;
  
  if (mentionCount > 0) {
    score += 0.1;
  }

  // Weight positive and negative words
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

function buildDetailedAnalysisReason(evidenceText, companyName, otherCompanyName, score, otherScore) {
  const normalizedText = evidenceText.toLowerCase();
  const normalizedCompany = companyName.toLowerCase();
  
  const positiveIndicators = ['growth', 'innovative', 'leading', 'strong', 'profit', 'popular', 'efficient', 'premium', 'best'];
  const negativeIndicators = ['recall', 'lawsuit', 'delay', 'loss', 'weak', 'decline', 'expensive', 'problem', 'complaint'];
  
  const foundPositive = positiveIndicators.filter(word => normalizedText.includes(word));
  const foundNegative = negativeIndicators.filter(word => normalizedText.includes(word));
  
  let analysis = '';
  
  const scoreDiff = score - otherScore;
  
  if (scoreDiff > 0.1) {
    // Significantly better
    analysis = `${companyName} has notably stronger market position compared to ${otherCompanyName}. `;
    if (foundPositive.length > 0) {
      analysis += `${companyName} shows advantages in ${foundPositive.slice(0, 2).join(' and ')}. `;
    }
    analysis += `This translates to better competitive standing.`;
  } else if (scoreDiff < -0.1) {
    // Significantly worse
    analysis = `${companyName} faces tougher competitive challenges versus ${otherCompanyName}. `;
    if (foundNegative.length > 0) {
      analysis += `Issues include ${foundNegative.slice(0, 2).join(' and ')}. `;
    }
    analysis += `${otherCompanyName} appears to have the advantage in current market dynamics.`;
  } else {
    // Closely matched
    analysis = `${companyName} and ${otherCompanyName} are competitively similar. `;
    if (foundPositive.length > foundNegative.length) {
      analysis += `${companyName} shows slightly positive momentum with ${foundPositive[0] || 'positive indicators'}.`;
    } else if (foundNegative.length > foundPositive.length) {
      analysis += `${companyName} faces some headwinds, though comparable to ${otherCompanyName}.`;
    } else {
      analysis += `Both show mixed signals in current reporting.`;
    }
  }
  
  return analysis;
}

export function buildHeuristicComparisonResult({ companyA, companyB, evidence }) {
  const evidenceText = evidence
    .map((item) => [item.title, item.summary, item.text].filter(Boolean).join(' '))
    .join(' ');

  const scoreA = computeMentionScore(evidenceText, companyA.name);
  const scoreB = computeMentionScore(evidenceText, companyB.name);
  
  const reasonA = buildDetailedAnalysisReason(evidenceText, companyA.name, companyB.name, scoreA, scoreB);
  const reasonB = buildDetailedAnalysisReason(evidenceText, companyB.name, companyA.name, scoreB, scoreA);
  
  // Always pick a winner - never tie
  let winner = '';
  let recommendationText = '';
  
  if (scoreA > scoreB) {
    winner = companyA.id;
    recommendationText = `Choose ${companyA.name}. Based on current market evidence, ${companyA.name} demonstrates stronger competitive positioning and better market reception compared to ${companyB.name}.`;
  } else if (scoreB > scoreA) {
    winner = companyB.id;
    recommendationText = `Choose ${companyB.name}. Based on current market evidence, ${companyB.name} demonstrates stronger competitive positioning and better market reception compared to ${companyA.name}.`;
  } else {
    // When tied, pick the first company but note slight preference
    winner = scoreA > 0.5 ? companyA.id : companyB.id;
    const recommendedCompany = winner === companyA.id ? companyA.name : companyB.name;
    const otherCompany = winner === companyA.id ? companyB.name : companyA.name;
    recommendationText = `Choose ${recommendedCompany}. Both companies show similar market dynamics, but ${recommendedCompany} has a slight edge in current sentiment versus ${otherCompany}.`;
  }

  return {
    [companyA.id]: {
      sentiment: Number(scoreA.toFixed(2)),
      confidence: 0.66,
      key_reason: reasonA,
    },
    [companyB.id]: {
      sentiment: Number(scoreB.toFixed(2)),
      confidence: 0.66,
      key_reason: reasonB,
    },
    summary: {
      winner,
      overview: recommendationText,
    },
  };
}

export function buildNoEvidenceComparisonResult({ companyA, companyB, waitMs }) {
  return {
    [companyA.id]: {
      sentiment: 0.5,
      confidence: 0.3,
      key_reason: `Unable to provide detailed analysis for ${companyA.name}. Recommend checking recent product reviews, tech specs, and user feedback directly to make your decision.`,
    },
    [companyB.id]: {
      sentiment: 0.5,
      confidence: 0.3,
      key_reason: `Unable to provide detailed analysis for ${companyB.name}. Recommend checking recent product reviews, tech specs, and user feedback directly to make your decision.`,
    },
    summary: {
      winner: 'tie',
      overview: `Insufficient data available for a confident recommendation between ${companyA.name} and ${companyB.name}. Please check recent product reviews, tech specs, pricing, and user feedback to compare these options directly.`,
    },
  };
}

export function formatComparisonResultForFrontend({ companyA, companyB, rawResult }) {
  if (rawResult?.left && rawResult?.right) {
    const leftInput = rawResult.left || {};
    const rightInput = rawResult.right || {};

    return {
      left: {
        id: String(leftInput.id || companyA.id),
        name: String(leftInput.name || companyA.name),
        score: normalizeFrontendScore(leftInput.score, 50),
        reason: leftInput.reason || `Evidence currently gives ${companyA.name} a balanced fit score.`,
      },
      right: {
        id: String(rightInput.id || companyB.id),
        name: String(rightInput.name || companyB.name),
        score: normalizeFrontendScore(rightInput.score, 50),
        reason: rightInput.reason || `Evidence currently gives ${companyB.name} a balanced fit score.`,
      },
      winner: normalizeFrontendWinner(rawResult.winner, companyA, companyB),
      comparison_summary: rawResult.comparison_summary || `Comparison generated for ${companyA.name} versus ${companyB.name}.`,
      confidence: normalizeConfidence(rawResult.confidence, 0.5),
    };
  }

  const leftRaw = rawResult?.[companyA.id] || {};
  const rightRaw = rawResult?.[companyB.id] || {};
  const summary = rawResult?.summary || {};

  const leftConfidence = normalizeConfidence(leftRaw.confidence, 0.5);
  const rightConfidence = normalizeConfidence(rightRaw.confidence, 0.5);

  let winner = 'tie';
  if (summary.winner === companyA.id) {
    winner = 'left';
  } else if (summary.winner === companyB.id) {
    winner = 'right';
  }

  return {
    left: {
      id: companyA.id,
      name: companyA.name,
      score: sentimentToScore(leftRaw.sentiment),
      reason: leftRaw.key_reason || `Evidence currently gives ${companyA.name} a balanced fit score.`,
    },
    right: {
      id: companyB.id,
      name: companyB.name,
      score: sentimentToScore(rightRaw.sentiment),
      reason: rightRaw.key_reason || `Evidence currently gives ${companyB.name} a balanced fit score.`,
    },
    winner,
    comparison_summary: summary.overview || `Comparison generated for ${companyA.name} versus ${companyB.name}.`,
    confidence: Number(((leftConfidence + rightConfidence) / 2).toFixed(2)),
  };
}
