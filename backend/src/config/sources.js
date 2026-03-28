export const sourceCatalog = {
  news: [
    {
      id: 'google-news',
      label: 'Google News',
      url: 'https://news.google.com',
      weight: 1.2,
      goal: (query, companyA, companyB) =>
        `Search for "${query}" comparing ${companyA} and ${companyB}. Return the top 8 results with title, source, publish date, url, and a 1-2 sentence summary.`,
    },
    {
      id: 'ev-news',
      label: 'EV News',
      url: 'https://electrek.co',
      weight: 1.4,
      goal: (query, companyA, companyB) =>
        `Find the latest coverage related to "${query}" and compare how ${companyA} and ${companyB} are described. Return headline, url, date, and concise summary for up to 6 articles.`,
    },
  ],
  financial: [
    {
      id: 'yahoo-finance',
      label: 'Yahoo Finance',
      url: 'https://finance.yahoo.com',
      weight: 1.1,
      goal: (query, companyA, companyB) =>
        `Search for "${query}" and gather recent market commentary on ${companyA} and ${companyB}. Return up to 10 recent observations, article notes, or public comments with source labels and timestamps when visible.`,
    },
  ],
  social: [
    {
      id: 'reddit',
      label: 'Reddit',
      platform: 'reddit',
      url: 'https://www.reddit.com/search/?q=',
      weight: 1,
      goal: (query, companyA, companyB) =>
        `Search Reddit for "${query}" plus ${companyA} and ${companyB}. Return up to 12 recent comments or post excerpts with author, subreddit, url, timestamp if visible, and exact text.`,
    },
    {
      id: 'youtube',
      label: 'YouTube',
      platform: 'youtube',
      url: 'https://www.youtube.com/results?search_query=',
      weight: 0.9,
      goal: (query, companyA, companyB) =>
        `Search YouTube for "${query}" comparing ${companyA} and ${companyB}. Return up to 8 recent video comments or discussion snippets with author, video title, url, timestamp if visible, and text.`,
    },
    {
      id: 'x',
      label: 'X',
      platform: 'x',
      url: 'https://x.com/search?q=',
      weight: 0.8,
      goal: (query, companyA, companyB) =>
        `Search public X posts for "${query}" related to ${companyA} and ${companyB}. Return up to 10 public posts with author, url, timestamp if visible, and exact text. If access is blocked, return an empty list instead of guessing.`,
    },
  ],
};

export function getSourcesByType(types = []) {
  return types.flatMap((type) => sourceCatalog[type] || []);
}
