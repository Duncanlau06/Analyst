import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Mock OpenAI initialization in case key is missing (fallback to heuristic happens client-side if API fails)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// 1. Scrape Endpoint (Proxy to TinyFish)
app.post('/api/scrape', async (req, res) => {
  const { url, goal } = req.body;

  if (!process.env.TINYFISH_API_KEY) {
    return res.status(500).json({ error: 'TINYFISH_API_KEY not configured' });
  }

  try {
    const response = await fetch('https://agent.tinyfish.ai/v1/automation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY
      },
      body: JSON.stringify({ url, goal })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`TinyFish error: ${response.status} ${err}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. OpenAI Sentiment Endpoint with Quote Extraction
app.post('/api/sentiment', async (req, res) => {
  const { text, companyA, companyB } = req.body;

  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured. Use heuristic fallback.' });
  }

  const prompt = `
Analyze the following text comparing ${companyA} vs ${companyB}.
Extract what actual people said (quotes, opinions, evidence).
Return JSON only:
{
  "${companyA}": { 
    "sentiment": 0.0-1.0, 
    "confidence": 0.0-1.0, 
    "key_reason": "one sentence summary",
    "quote": "actual quote or paraphrased insight from people about ${companyA}",
    "source_hint": "e.g., analyst, user comment, expert"
  },
  "${companyB}": { 
    "sentiment": 0.0-1.0, 
    "confidence": 0.0-1.0, 
    "key_reason": "one sentence summary",
    "quote": "actual quote or paraphrased insight from people about ${companyB}",
    "source_hint": "e.g., analyst, user comment, expert"
  }
}

Text:
${text}
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    console.error('Sentiment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Comparison Analysis Endpoint
app.post('/api/comparisons/analyze', async (req, res) => {
  const { query, leftOption, rightOption, companyA, companyB, sources = ['social'] } = req.body;

  try {
    addTickerItem = (msg) => console.log(msg); // placeholder

    // Scrape data for both options
    let leftScrapeData = '';
    let rightScrapeData = '';

    for (const source of sources) {
      const leftBuilUrl = leftOption.buildUrl?.(query) || `${leftOption.url}${encodeURIComponent(query)}`;
      const rightBuildUrl = rightOption.buildUrl?.(query) || `${rightOption.url}${encodeURIComponent(query)}`;

      // Scrape left option
      try {
        const leftResp = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: leftBuilUrl, goal: leftOption.goal?.(query) || `Get sentiment about ${leftOption.name}` })
        });
        if (leftResp.ok) {
          const leftData = await leftResp.json();
          leftScrapeData += ' ' + JSON.stringify(leftData);
        }
      } catch (e) {
        console.log('Left scrape error:', e.message);
      }

      // Scrape right option
      try {
        const rightResp = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rightBuildUrl, goal: rightOption.goal?.(query) || `Get sentiment about ${rightOption.name}` })
        });
        if (rightResp.ok) {
          const rightData = await rightResp.json();
          rightScrapeData += ' ' + JSON.stringify(rightData);
        }
      } catch (e) {
        console.log('Right scrape error:', e.message);
      }
    }

    // Analyze sentiment with quotes
    const sentimentResp = await fetch('http://localhost:3001/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${leftScrapeData}\n\n${rightScrapeData}`,
        companyA: leftOption.name,
        companyB: rightOption.name
      })
    });

    if (!sentimentResp.ok) {
      throw new Error('Sentiment analysis failed');
    }

    const sentimentData = await sentimentResp.json();
    const leftRaw = sentimentData[leftOption.name] || {};
    const rightRaw = sentimentData[rightOption.name] || {};

    const leftScore = Math.round((leftRaw.sentiment || 0.5) * 100);
    const rightScore = Math.round((rightRaw.sentiment || 0.5) * 100);

    // Build comparison summary that includes what people said
    let comparisonSummary = '';
    if (leftScore > rightScore) {
      comparisonSummary = `People favor ${leftOption.name}: "${leftRaw.quote || leftRaw.key_reason}". ${rightOption.name} seen as: "${rightRaw.quote || rightRaw.key_reason}".`;
    } else if (rightScore > leftScore) {
      comparisonSummary = `People favor ${rightOption.name}: "${rightRaw.quote || rightRaw.key_reason}". ${leftOption.name} seen as: "${leftRaw.quote || rightRaw.key_reason}".`;
    } else {
      comparisonSummary = `Opinions split: ${leftOption.name} - "${leftRaw.quote || leftRaw.key_reason}". ${rightOption.name} - "${rightRaw.quote || rightRaw.key_reason}".`;
    }

    const results = {
      left: {
        name: leftOption.name,
        score: leftScore,
        reason: leftRaw.quote || leftRaw.key_reason || 'No data available',
        source: leftRaw.source_hint || 'Web research'
      },
      right: {
        name: rightOption.name,
        score: rightScore,
        reason: rightRaw.quote || rightRaw.key_reason || 'No data available',
        source: rightRaw.source_hint || 'Web research'
      },
      winner: leftScore > rightScore ? 'left' : rightScore > leftScore ? 'right' : 'tie',
      confidence: ((leftRaw.confidence || 0.5) + (rightRaw.confidence || 0.5)) / 2,
      comparison_summary: comparisonSummary
    };

    res.json({ results });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});
