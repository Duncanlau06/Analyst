export const sourceCatalog = {
  news: [
    {
      id: 'google-news',
      label: 'Google News',
      url: 'https://news.google.com/search?q=',
      weight: 1.2,
      buildUrl: (query) => `https://news.google.com/search?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the page and extract up to 5 visible search results for "${query}". For each result, return title, source name if visible, url, and a short snippet. Respond with concise JSON.`,
    },
    {
      id: 'reuters-search',
      label: 'Reuters',
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
      platform: 'reddit',
      url: 'https://www.reddit.com/search/?q=',
      weight: 1,
      buildUrl: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      goal: (query) =>
        `Open the search page and extract up to 5 visible Reddit posts or comments for "${query}". Return author if visible, subreddit if visible, url, and short text in concise JSON.`,
    },
    {
      id: 'hacker-news',
      label: 'Hacker News',
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

export const smokeTestSource = {
  id: 'tinyfish-smoke-test',
  label: 'TinyFish Smoke Test',
  url: 'https://scrapeme.live/shop',
  goal:
    'Extract the first 3 product names and prices visible on the page. Return concise JSON with a products array.',
};
