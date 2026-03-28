import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  tinyfishApiKey: process.env.TINYFISH_API_KEY || '',
  tinyfishBaseUrl: process.env.TINYFISH_BASE_URL || 'https://agent.tinyfish.ai/v1',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 1000 * 60 * 10),
};

export const hasTinyfish = Boolean(env.tinyfishApiKey);
export const hasOpenAI = Boolean(env.openaiApiKey);
