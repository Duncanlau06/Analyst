export const sourceCatalog = {
  social: [
    {
      id: 'reddit',
      label: 'Reddit',
      priority: 150,
      platform: 'reddit',
      url: 'https://www.reddit.com/search/?q=',
      weight: 1.5,
      buildUrl: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Extract 2 top posts for "${query}". JSON: [{title, author, url}]`,
    },
    {
      id: 'twitter-x',
      label: 'X / Twitter',
      priority: 145,
      platform: 'x',
      url: 'https://x.com/search?q=',
      weight: 1.4,
      buildUrl: (query) => `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`,
      goal: (query) =>
        `Extract 2 top posts for "${query}". JSON: [{author, text, url}]`,
    },
  ],
  news: [
  ],
  financial: [],
};

export const sentimentCatalog = {
  social: [
    {
      id: 'reddit',
      label: 'Reddit',
      priority: 150,
      platform: 'reddit',
      url: 'https://www.reddit.com/search/?q=',
      weight: 1.5,
      buildUrl: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Extract sentiment data from top 5 comments on 1 post for "${query}". Return ONLY: JSON: [{text, sentiment}] where sentiment is positive/negative/neutral.`,
    },
    {
      id: 'twitter-x',
      label: 'X / Twitter',
      priority: 145,
      platform: 'x',
      url: 'https://x.com/search?q=',
      weight: 1.4,
      buildUrl: (query) => `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`,
      goal: (query) =>
        `Extract sentiment data from top 5 comments on 1 post for "${query}". Return ONLY: JSON: [{text, sentiment}] where sentiment is positive/negative/neutral.`,
    },
  ],
};

export function getSourcesByType(types = [], useSentimentCatalog = false) {
  const catalog = useSentimentCatalog ? sentimentCatalog : sourceCatalog;
  return types.flatMap((type) => catalog[type] || []);
}

export function getRankedSourcesByType(types = [], maxCount = Infinity, useSentimentCatalog = false) {
  return getSourcesByType(types, useSentimentCatalog)
    .sort((left, right) => (right.priority || 0) - (left.priority || 0))
    .slice(0, Math.max(0, maxCount));
}

export function getSourcesForSentiment(maxCount = Infinity) {
  return getRankedSourcesByType(['social'], maxCount, true);
}

export const smokeTestSource = {
  id: 'tinyfish-smoke-test',
  label: 'TinyFish Smoke Test',
  url: 'https://scrapeme.live/shop',
  goal:
    'Extract the first 3 product names and prices visible on the page. Return concise JSON with a products array.',
};
