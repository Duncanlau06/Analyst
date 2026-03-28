export function buildSentimentPrompt({ companyA, companyB, normalizedEvidence }) {
  const evidenceText = normalizedEvidence
    .map((item, index) => {
      const text = [item.title, item.summary, item.text].filter(Boolean).join(' | ');
      return `${index + 1}. [${item.sourceType}/${item.sourceLabel}] ${text}`;
    })
    .slice(0, 40)
    .join('\n');

  return `
You are analyzing and comparing ${companyA.name} versus ${companyB.name} based on recent user feedback and market evidence.

Your task is to provide SPECIFIC, CONCRETE reasons why one is objectively better than the other.

Return JSON only in this exact shape:
{
  "${companyA.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Specific, concrete reasons to choose ${companyA.name} over ${companyB.name}. Format: '${companyA.name} is better because: [REASON 1] - [cite specific evidence]. [REASON 2] - [cite specific evidence]. [REASON 3] - [cite specific evidence].' Make comparison explicit: 'Unlike ${companyB.name}, ${companyA.name}...'"
  },
  "${companyB.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Specific, concrete reasons to choose ${companyB.name} over ${companyA.name}. Format: '${companyB.name} is better because: [REASON 1] - [cite specific evidence]. [REASON 2] - [cite specific evidence]. [REASON 3] - [cite specific evidence].' Make comparison explicit: 'Unlike ${companyA.name}, ${companyB.name}...'"
  },
  "summary": {
    "winner": "MUST be ${companyA.id} or ${companyB.id} (never 'tie'). Pick the clear winner.",
    "overview": "STRONG RECOMMENDATION statement: 'Choose ${companyA.name} because [TOP REASON with evidence]. [Second reason]. [Why this matters vs ${companyB.name}].' Be decisive and specific. If ${companyA.name} leads, state specific advantages. If tied, pick one and explain slight edge. Never say 'similar' or 'comparable'."
  }
}

Critical Rules for Reasons:
- MUST cite SPECIFIC evidence from the text (e.g., 'Users report 95% satisfaction vs 87%', 'Offers 40% faster processing', 'Costs $20/month vs $50/month')
- MUST make direct comparative statements (e.g., 'Better at X than Y', 'Lacks Y which Z has')
- MUST include 3 distinct concrete reasons with evidence
- Format: "Reason 1 (concrete fact). Reason 2 (concrete fact). Reason 3 (concrete fact)."
- NO vague statements like "shows momentum" or "positive reception"
- NO hedging language
- Weight user feedback (social) heavily for real performance indicators

Evidence:
${evidenceText}
`.trim();
}

export function buildFallbackComparisonPrompt({ companyA, companyB, query }) {
  return `
You are helping a user choose between "${companyA.name}" and "${companyB.name}" for: "${query}"

Provide SPECIFIC, CONCRETE reasons why one option is objectively better than the other.

Return JSON only in this exact shape:
{
  "${companyA.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Specific reasons to choose ${companyA.name} over ${companyB.name}. Format: '${companyA.name} is better because: [REASON 1 with specifics] - [example or stat]. [REASON 2 with specifics] - [example or stat]. [REASON 3 with specifics] - [example or stat].' Make it direct: 'Unlike ${companyB.name}, ${companyA.name}...'"
  },
  "${companyB.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "Specific reasons to choose ${companyB.name} over ${companyA.name}. Format: '${companyB.name} is better because: [REASON 1 with specifics] - [example or stat]. [REASON 2 with specifics] - [example or stat]. [REASON 3 with specifics] - [example or stat].' Make it direct: 'Unlike ${companyA.name}, ${companyB.name}...'"
  },
  "summary": {
    "winner": "MUST be ${companyA.id} or ${companyB.id} (never 'tie'). Pick the objectively better option.",
    "overview": "STRONG RECOMMENDATION: 'Choose ${companyA.name} for '${query}' because [TOP REASON 1 specific to the query]. [TOP REASON 2]. [Why this beats ${companyB.name}].' Be decisive. State clear advantage for the stated use case. No hedging."
  }
}

Critical Rules for Reasons:
- MUST provide 3 CONCRETE, SPECIFIC reasons with details
- MUST compare directly (e.g., 'Better at X than Y', 'Has feature Z which ${companyB.name} lacks')
- Reasons MUST be based on: features relevant to ${query}, pricing, ecosystem, performance, reliability, ease of use
- Format example: '${companyA.name} offers API integration (${companyB.name} requires manual setup). Has 50+ pre-built templates (vs 10). Costs $30/month (${companyB.name} is $60).'
- NO vague language like 'better overall' or 'more popular'
- Be specific about HOW it's better for this use case
- Make summary a strong, decisive recommendation
  `.trim();
}
