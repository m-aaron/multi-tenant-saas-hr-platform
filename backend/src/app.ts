import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { API_PREFIX } from '#config/constant.js';

import healthRouter from '#modules/health/health.route.js';
import authRouter from '#modules/auth/routes/auth.route.js';

import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';

import { setupSwagger } from '#docs/swagger.js';


const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

setupSwagger(app);

app.use(`${API_PREFIX}`, healthRouter); // Health check route
app.use(`${API_PREFIX}/auth`, authRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;