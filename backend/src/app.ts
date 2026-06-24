import express, { type Express } from 'express';
import { API_PREFIX } from '#config/constant.js';

const app: Express = express();

app.use(express.json());

// Health check endpoint
app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json({ status: 'ok' });
});

export default app;
