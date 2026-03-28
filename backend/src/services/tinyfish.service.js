import { env, hasTinyfish } from '../config/env.js';
import { AppError } from '../utils/errors.js';

async function tinyfishRequest(body) {
  if (!hasTinyfish) {
    throw new AppError('TINYFISH_API_KEY not configured', 500);
  }

  const response = await fetch(`${env.tinyfishBaseUrl}/automation/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.tinyfishApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(`TinyFish error: ${response.status} ${errorBody}`, 502);
  }

  return response.json();
}

export async function runTinyfishAutomation({ url, goal }) {
  return tinyfishRequest({ url, goal });
}
