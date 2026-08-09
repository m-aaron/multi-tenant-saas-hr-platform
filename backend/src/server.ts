import app from './app.js';
import { env } from './configs/env.js';
import { logger } from '#shared/logger/logger.js';

app.listen(env.port, '0.0.0.0', () => {
  logger.info(`Server running on port ${env.port}`);
});