function extractText(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join(' ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value).map(extractText).filter(Boolean).join(' ');
  }

  return '';
}

export function normalizeTinyfishResult(runResult, source) {
  const rawResult = runResult?.result ?? runResult?.data ?? runResult;
  const flattenedText = extractText(rawResult).trim();

  const fallbackItem = {
    sourceId: source.id,
    sourceLabel: source.label,
    sourceType: source.sourceType,
    platform: source.platform || null,
    title: `${source.label} summary`,
    summary: flattenedText.slice(0, 4000),
    text: flattenedText.slice(0, 6000),
    url: source.url,
    publishedAt: null,
    raw: rawResult,
  };

  if (Array.isArray(rawResult) && rawResult.length > 0) {
    return rawResult.map((item, index) => ({
      sourceId: source.id,
      sourceLabel: source.label,
      sourceType: source.sourceType,
      platform: source.platform || null,
      title: item.title || item.headline || item.videoTitle || `${source.label} item ${index + 1}`,
      summary: item.summary || item.snippet || item.description || '',
      text: item.text || item.comment || item.body || extractText(item).slice(0, 4000),
      author: item.author || item.username || null,
      url: item.url || item.link || source.url,
      publishedAt: item.publishedAt || item.timestamp || item.date || null,
      raw: item,
    }));
  }

  return flattenedText ? [fallbackItem] : [];
}

export function buildCommentItems(evidence = []) {
  return evidence
    .filter((item) => item.sourceType === 'social')
    .map((item) => ({
      platform: item.platform || item.sourceId,
      author: item.author || 'Unknown',
      text: item.text || item.summary || item.title,
      postedAt: item.publishedAt,
      url: item.url,
      sourceLabel: item.sourceLabel,
    }))
    .filter((item) => item.text);
}
