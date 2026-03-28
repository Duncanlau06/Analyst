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

// 2. OpenAI Sentiment Endpoint
app.post('/api/sentiment', async (req, res) => {
  const { text, companyA, companyB } = req.body;
  
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured. Use heuristic fallback.' });
  }

  const prompt = `
Analyze the following text comparing ${companyA} vs ${companyB}.
Return JSON only:
{
  "${companyA}": { "sentiment": 0.0-1.0, "confidence": 0.0-1.0, "key_reason": "one sentence" },
  "${companyB}": { "sentiment": 0.0-1.0, "confidence": 0.0-1.0, "key_reason": "one sentence" }
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

const suggestCache = new Map();

// 3. AI Suggestion Endpoint
app.post('/api/suggest', async (req, res) => {
  const { query } = req.body;
  
  if (!openai || !query || query.length < 2) {
    return res.json([]); 
  }

  const cacheKey = query.toLowerCase().trim();
  if (suggestCache.has(cacheKey)) {
    return res.json(suggestCache.get(cacheKey));
  }

  const prompt = `The user is typing a product name. 
Partial query: "${query}"
Return a JSON object with a key "suggestions" containing a list of 5 real-world brands or models related to this query.
Example for "Nik": {"suggestions": ["Nikon", "Nikon Z9", "Nikon D850", "Canon", "Sony"]}
Return ONLY the JSON. No markdown. No chatter.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    let suggestions = [];
    
    if (Array.isArray(parsed.suggestions)) {
      suggestions = parsed.suggestions;
    } else if (Array.isArray(parsed)) {
      suggestions = parsed;
    } else {
      const possibleArray = Object.values(parsed).find(v => Array.isArray(v));
      suggestions = possibleArray || [];
    }

    const filtered = suggestions.filter(s => typeof s === 'string');
    
    // Cache the result
    suggestCache.set(cacheKey, filtered);
    // Optional: limit cache size
    if (suggestCache.size > 200) suggestCache.delete(suggestCache.keys().next().value);

    res.json(filtered);
  } catch (err) {
    console.error('Suggest error:', err);
    res.json([]);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});
