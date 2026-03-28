import { app } from './src/app.js';
import { env } from './src/config/env.js';

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Advanced backend running on http://localhost:${PORT}`);
  console.log(`TinyFish configured: ${process.env.TINYFISH_API_KEY ? '✓' : '✗'}`);
  console.log(`OpenAI configured: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
});
