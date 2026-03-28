# Analyst

A web application that compares two options and provides AI-powered recommendations based on real user sentiment from Reddit and X (Twitter).

## Features

- **Real-time Sentiment Analysis**: Scrapes user opinions from Reddit and X using TinyFish automation
- **AI-Powered Recommendations**: Uses ChatGPT to analyze evidence and provide specific, actionable recommendations
- **Visual Comparison**: Interactive "Winner Bar" showing percentage split (e.g., 66% vs 34%) with smooth animations
- **Detailed Reasoning**: Provides 3-point comparative analysis for each option explaining why one is better
- **Actionable Summaries**: Clear recommendation stating which option to choose and why

## How It Works

1. User enters a comparison query (e.g., "ChatGPT vs Gemini")
2. TinyFish scrapes data from **Reddit** and **X only**
3. Data is normalized and analyzed for sentiment
4. ChatGPT provides specific comparative reasons and recommendations
5. Results displayed with interactive winner bar and confidence metrics

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite (build tool)
- CSS with smooth animations

**Backend:**
- Node.js + Express
- OpenAI API for analysis
- TinyFish API for web scraping
- Redis caching

## Installation

```bash
npm install
```

## Running the Project

```bash
# Development mode
npm run dev

# Production build
npm run build
```

## Configuration

Key environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `TINYFISH_API_KEY` - TinyFish API key
- `ANALYSIS_POLL_BUDGET_MS` - Scraping timeout (default: 30000ms)

## Key Optimizations

- ✅ Scrapes from Reddit and X only (real user sentiment)
- ✅ Shows percentage split on animated winner bar (e.g., 70% / 30%)
- ✅ Provides 3 specific reasons for each option (not generic)
- ✅ Clear recommendation explaining why one option wins
- ✅ User-focused messaging (no scraping/timeout details)

---

Built for NUS Hackathon - Agentic Friday Hacks