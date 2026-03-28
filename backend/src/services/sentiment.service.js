import OpenAI from 'openai';
import { env, hasOpenAI } from '../config/env.js';
import { buildHeuristicComparisonResult } from './scoring.service.js';
import { buildFallbackComparisonPrompt, buildSentimentPrompt } from '../utils/prompts.js';

const openai = hasOpenAI ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export async function analyzeComparisonSentiment({ companyA, companyB, evidence }) {
  if (env.tinyfishOnlyMode) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence });
  }

  if (!openai) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence });
  }

  const prompt = buildSentimentPrompt({ companyA, companyB, normalizedEvidence: evidence });

  try {
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence });
  }
}

export async function analyzeComparisonWithoutEvidence({ companyA, companyB, query }) {
  if (env.tinyfishOnlyMode) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence: [] });
  }

  if (!openai) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence: [] });
  }

  const prompt = buildFallbackComparisonPrompt({ companyA, companyB, query });

  try {
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    return buildHeuristicComparisonResult({ companyA, companyB, evidence: [] });
  }
}
