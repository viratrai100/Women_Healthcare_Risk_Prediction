import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { validateProviderConfig } from './services/ai/index.js';

const PORT = process.env.PORT || 5000;

// Validate AI provider config at startup — fail fast on misconfiguration
try {
  validateProviderConfig();
} catch (err) {
  console.error('[server] AI provider misconfigured:', err.message);
  process.exit(1);
}

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
