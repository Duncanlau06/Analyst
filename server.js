import { app } from './backend/src/app.js';
import { env } from './backend/src/config/env.js';

app.listen(env.port, () => {
  console.log(`Backend proxy running on http://localhost:${env.port}`);
});
