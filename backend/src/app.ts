import express, { type Express } from 'express';
import { API_PREFIX } from '#config/constant.js';
import healthRouter from '#modules/health/health.route.js';
import errorHandler from '#shared/errors/error-handler.js';

const app: Express = express();

app.use(express.json());
app.use(errorHandler);

// Health check endpoint with database connectivity, uptime, and environment
app.use(`${API_PREFIX}`, healthRouter);

export default app;