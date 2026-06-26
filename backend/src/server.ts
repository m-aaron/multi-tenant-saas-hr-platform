import 'dotenv/config';
import app from './app.js';
import logger from '#shared/logger/logger.js';

const PORT = Number(process.env['PORT'] ?? 4000);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});