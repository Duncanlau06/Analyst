export function buildSentimentPrompt({ companyA, companyB, normalizedEvidence }) {
  const evidenceText = normalizedEvidence
    .map((item, index) => {
      const text = [item.title, item.summary, item.text].filter(Boolean).join(' | ');
      return `${index + 1}. [${item.sourceType}/${item.sourceLabel}] ${text}`;
    })
    .slice(0, 40)
    .join('\n');

  return `
Analyze market and public sentiment for ${companyA.name} (${companyA.id}) versus ${companyB.name} (${companyB.id}).

Return JSON only in this shape:
{
  "${companyA.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "one sentence"
  },
  "${companyB.id}": {
    "sentiment": 0.0,
    "confidence": 0.0,
    "key_reason": "one sentence"
  },
  "summary": {
    "winner": "${companyA.id} or ${companyB.id} or tie",
    "overview": "one sentence"
  }
}

Rules:
- Sentiment is relative favorability from 0 to 1.
- Use the provided evidence only.
- If evidence is weak or mixed, lower confidence.
- Reasons should mention product, pricing, delivery, innovation, demand, or public perception if present.

Evidence:
${evidenceText}
`.trim();
}
