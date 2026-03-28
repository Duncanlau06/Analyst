export const sourceCatalog = {
  news: [
    {
      id: 'google-news',
      label: 'Google News',
      priority: 100,
      url: 'https://news.google.com/search?q=',
      weight: 1.2,
      buildUrl: (query) => `https://news.google.com/search?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the page and extract up to 5 visible search results for "${query}". For each result, return title, source name if visible, url, and a short snippet. Respond with concise JSON.`,
    },
    {
      id: 'reuters-search',
      label: 'Reuters',
      priority: 60,
      url: 'https://www.reuters.com/site-search/',
      weight: 1.4,
      buildUrl: (query) => `https://www.reuters.com/site-search/?query=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the search results page and extract up to 5 visible results for "${query}". Return title, url, and a short snippet in concise JSON.`,
    },
  ],
  financial: [
    {
      id: 'marketwatch-search',
      label: 'MarketWatch',
      priority: 90,
      url: 'https://www.marketwatch.com/search',
      weight: 1.1,
      buildUrl: (query) => `https://www.marketwatch.com/search?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the search results page and extract up to 5 visible results for "${query}". Return title, url, and a one-sentence snippet in concise JSON.`,
    },
  ],
  social: [
    {
      id: 'reddit',
      label: 'Reddit',
      priority: 100,
      platform: 'reddit',
      url: 'https://www.reddit.com/search/?q=',
      weight: 1,
      buildUrl: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the search page and extract up to 5 visible Reddit posts or comments for "${query}". Return author if visible, subreddit if visible, url, and short text in concise JSON.`,
    },
    {
      id: 'twitter-x',
      label: 'X / Twitter',
      priority: 95,
      platform: 'x',
      url: 'https://x.com/search?q=',
      weight: 0.95,
      buildUrl: (query) => `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`,
      goal: (query) =>
        `Open the live search page and extract up to 5 visible posts for "${query}". Return author if visible, url, and short text in concise JSON.`,
    },
    {
      id: 'hacker-news',
      label: 'Hacker News',
      priority: 70,
      platform: 'hn',
      url: 'https://hn.algolia.com/',
      weight: 0.8,
      buildUrl: (query) => `https://hn.algolia.com/?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the search page and extract up to 5 visible discussion results for "${query}". Return title, url, points or author if visible, and a short snippet in concise JSON.`,
    },
  ],
};

export function getSourcesByType(types = []) {
  return types.flatMap((type) => sourceCatalog[type] || []);
}

export function getRankedSourcesByType(types = [], maxCount = Infinity) {
  return getSourcesByType(types)
    .sort((left, right) => (right.priority || 0) - (left.priority || 0))
    .slice(0, Math.max(0, maxCount));
}

export const smokeTestSource = {
  id: 'tinyfish-smoke-test',
  label: 'TinyFish Smoke Test',
  url: 'https://scrapeme.live/shop',
  goal:
    'Extract the first 3 product names and prices visible on the page. Return concise JSON with a products array.',
};
