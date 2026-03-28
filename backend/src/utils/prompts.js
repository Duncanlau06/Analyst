export function buildSentimentPrompt({ companyA, companyB, normalizedEvidence }) {
  const evidenceText = normalizedEvidence
    .map((item, index) => {
      const text = [item.title, item.summary, item.text].filter(Boolean).join(' | ');
      return `${index + 1}. [${item.sourceType}/${item.sourceLabel}] ${text}`;
    })
    .slice(0, 40)
    .join('\n');

  return `
You are analyzing and comparing ${companyA.name} versus ${companyB.name} based on recent evidence and user sentiment.

Your task is to provide a COMPARATIVE analysis explaining why one option is specifically better than the other in practical, measurable ways.

Return JSON only in this exact shape:
{
  "${companyA.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Why ${companyA.name} is the better choice compared to ${companyB.name}. Be specific: cite 2-3 concrete advantages from the evidence (e.g., better user satisfaction, stronger performance metrics, lower pricing, superior product features, better market reception). Explain HOW ${companyA.name} outperforms ${companyB.name} on these factors."
  },
  "${companyB.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Why ${companyB.name} is the better choice compared to ${companyA.name}. Be specific: cite 2-3 concrete advantages from the evidence (e.g., better user satisfaction, stronger performance metrics, lower pricing, superior product features, better market reception). Explain HOW ${companyB.name} outperforms ${companyA.name} on these factors."
  },
  "summary": {
    "winner": "MUST be ${companyA.id} or ${companyB.id} (never 'tie'). Pick the clear winner.",
    "overview": "Recommendation: Choose ${companyA.name} OR Choose ${companyB.name}. Explain in 2-3 sentences the top 2-3 specific reasons why the winner is objectively better. Focus on measurable differences: product quality advantages, user satisfaction levels, pricing/value, innovation, reliability, or market performance. Make it clear and actionable."
  }
}

Critical Rules:
- ALWAYS pick a winner. There is no tie.
- Sentiment: 0-1 scale rating how favorable the evidence is toward that company.
- Confidence: Rate how strongly the evidence supports this conclusion. 0.8+ = strong consensus; 0.6-0.7 = moderate; below 0.6 = weak.
- COMPARATIVE analysis only: Each reason must compare the two companies directly. Don't describe them in isolation.
- Cite specific evidence: Reference actual findings from articles and user feedback.
- Weight real user sentiment (social) heavily - it's the most reliable indicator of satisfaction.
- Be direct: State which company is objectively better and why, without hedging.
- No mentions of data collection, scraping, or analysis limitations.

Evidence:
${evidenceText}
`.trim();
}

export function buildFallbackComparisonPrompt({ companyA, companyB, query }) {
  return `
You are helping a user choose between "${companyA.name}" and "${companyB.name}" for this specific need: "${query}"

Provide a clear RECOMMENDATION of one option, with specific reasons why it's the better choice.

Return JSON only in this exact shape:
{
  "${companyA.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Explain why ${companyA.name} is better than ${companyB.name} for this use case. Be specific: State 2-3 concrete advantages (e.g., better features for the stated need, superior pricing, stronger ecosystem, better performance, superior reliability). Directly compare: explicitly say HOW ${companyA.name} beats ${companyB.name} on these factors."
  },
  "${companyB.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Explain why ${companyB.name} is better than ${companyA.name} for this use case. Be specific: State 2-3 concrete advantages (e.g., better features for the stated need, superior pricing, stronger ecosystem, better performance, superior reliability). Directly compare: explicitly say HOW ${companyB.name} beats ${companyA.name} on these factors."
  },
  "summary": {
    "winner": "MUST be either ${companyA.id} or ${companyB.id} (never 'tie'). Choose the objectively better option for the stated need.",
    "overview": "Recommendation: Choose ${companyA.name} OR Choose ${companyB.name}. Explain in 2-3 sentences the top 2-3 specific reasons this option is objectively better for the stated use case. Be direct and actionable."
  }
}

Critical Rules:
- ALWAYS pick a winner. There is no tie.
- Sentiment (0-1): How well each option fits the stated need. Higher = better fit for the query.
- Confidence: 0.7-0.85 for most mainstream comparisons; lower only if truly ambiguous.
- COMPARATIVE analysis: Each advantage must explicitly compare the two options.
- Direct recommendation: Your summary must clearly state which one to choose and why.
- Focus on practical fit: What makes one option objectively better for "${query}"?
- Mention specific features, pricing tiers, ecosystem strengths, or use-case fit as relevant.
- Be confident: Only hedge on confidence score if the choice truly depends on personal preference.
- No disclaimers: Don't mention limitations, missing data, or that real-time info is unavailable.

Use Case: "${query}"
Comparison: ${companyA.name} vs ${companyB.name}
  `.trim();
}
