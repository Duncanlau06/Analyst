// Basic heuristic sentiment analyzer fallback
export const analyzeSentimentHeuristic = (text, companyA, companyB) => {
  const t = text.toLowerCase();
  
  const posKeywords = ['growth', 'record', 'innovative', 'leading', 'beat', 'surge', 'strong', 'profit', 'expansion', 'outperforms'];
  const negKeywords = ['decline', 'recall', 'lawsuit', 'delay', 'loss', 'miss', 'weak', 'pressure', 'cut', 'trails'];

  const scoreCompany = (companyName) => {
    let score = 0;
    const name = companyName.toLowerCase();
    const parts = t.split(name);
    
    // Simplistic heuristic: check keywords near the company mentions
    for (let i = 1; i < parts.length; i++) {
       const context = (parts[i-1].slice(-50) + parts[i].slice(0, 50)).toLowerCase();
       posKeywords.forEach(k => { if (context.includes(k)) score += 0.15; });
       negKeywords.forEach(k => { if (context.includes(k)) score -= 0.15; });
    }
    
    const base = 0.5;
    return Math.min(1, Math.max(0, base + score));
  };

  const sentimentA = scoreCompany(companyA);
  const sentimentB = scoreCompany(companyB);

  return {
    [companyA]: {
      sentiment: Number(sentimentA.toFixed(2)),
      confidence: 0.70, // Harcoded lower confidence for heuristic
      key_reason: `Heuristic fallback: Context analysis around ${companyA} mentions. (API offline)`
    },
    [companyB]: {
      sentiment: Number(sentimentB.toFixed(2)),
      confidence: 0.70,
      key_reason: `Heuristic fallback: Context analysis around ${companyB} mentions. (API offline)`
    }
  };
};
