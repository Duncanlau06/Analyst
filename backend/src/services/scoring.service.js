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

export function buildNoEvidenceComparisonResult({ companyA, companyB, waitMs }) {
  return {
    [companyA.id]: {
      sentiment: 0.5,
      confidence: 0.2,
      key_reason: `TinyFish did not return enough completed evidence for ${companyA.name} within ${Math.round(waitMs / 1000)} seconds.`,
    },
    [companyB.id]: {
      sentiment: 0.5,
      confidence: 0.2,
      key_reason: `TinyFish did not return enough completed evidence for ${companyB.name} within ${Math.round(waitMs / 1000)} seconds.`,
    },
    summary: {
      winner: 'tie',
      overview: `TinyFish-only mode timed out before enough evidence was collected for ${companyA.name} versus ${companyB.name}.`,
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
