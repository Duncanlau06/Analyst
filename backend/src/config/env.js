import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  tinyfishApiKey: process.env.TINYFISH_API_KEY || '',
  tinyfishBaseUrl: process.env.TINYFISH_BASE_URL || 'https://agent.tinyfish.ai/v1',
  tinyfishTimeoutMs: Number(process.env.TINYFISH_TIMEOUT_MS || 120000),
  analysisSourceTimeoutMs: Number(process.env.ANALYSIS_SOURCE_TIMEOUT_MS || process.env.TINYFISH_TIMEOUT_MS || 120000),
  analysisPollBudgetMs: Number(process.env.ANALYSIS_POLL_BUDGET_MS || 110000),
  analysisPollIntervalMs: Number(process.env.ANALYSIS_POLL_INTERVAL_MS || 3000),
  analysisMaxSources: Number(process.env.ANALYSIS_MAX_SOURCES || 3),
  analysisMaxSocialSources: Number(process.env.ANALYSIS_MAX_SOCIAL_SOURCES || 2),
  tinyfishOnlyMode: process.env.TINYFISH_ONLY_MODE !== 'false',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 1000 * 60 * 10),
};

export const hasTinyfish = Boolean(env.tinyfishApiKey);
export const hasOpenAI = Boolean(env.openaiApiKey);
