import express, { type Express } from 'express';
import { API_PREFIX } from '#config/constant.js';
import healthRouter from '#modules/health/health.route.js';

const app: Express = express();

app.use(express.json());

// Health check endpoint with database connectivity, uptime, and environment
app.use(`${API_PREFIX}`, healthRouter);

export default app;