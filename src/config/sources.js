export const sources = [
  {
    id: 'ev_news',
    category: 'EV News',
    sites: 'Electrek, InsideEVs, Teslarati',
    weight: 1.5,
    type: 'News',
    getGoal: (query) => `Scrape the 5 latest articles mentioning '${query}'. Extract headlines and the first 3 paragraphs of each.`
  },
  {
    id: 'financial',
    category: 'Financial',
    sites: 'Yahoo Finance, Bloomberg',
    weight: 1.2,
    type: 'News',
    getGoal: (query) => `Navigate to Yahoo Finance or Bloomberg for '${query}'. Extract the 20 most recent user comments or analyst notes.`
  },
  {
    id: 'tech',
    category: 'Global Tech',
    sites: 'The Verge, TechCrunch',
    weight: 1.0,
    type: 'News',
    getGoal: (query) => `Find articles about '${query}'. Extract key bullet points regarding market share or features.`
  },
  {
    id: 'aggregators',
    category: 'Aggregators',
    sites: 'Google News',
    weight: 1.2,
    type: 'News',
    getGoal: (query) => `Search Google News for '${query}' and return the snippets and titles of the top 10 results.`
  }
];
