import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { API_PREFIX } from './configs/constant.js';

import healthRouter from '#modules/health/routes/health.route.js';
import authRouter from '#modules/auth/routes/auth.route.js';
import organizationRouter from '#modules/organization/routes/organization.route.js'
import departmentRouter from '#modules/department/routes/department.route.js';
import employeeRouter from '#modules/employee/routes/employee.route.js';
import userRouter from '#modules/user/routes/user.route.js';
import profileRouter from '#modules/profile/routes/profile.route.js';
import activityRouter from '#modules/activity/routes/activity.route.js';

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
app.use(`${API_PREFIX}/organizations`, organizationRouter);
app.use(`${API_PREFIX}/departments`, departmentRouter);
app.use(`${API_PREFIX}/employees`, employeeRouter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/profile`, profileRouter);
app.use(`${API_PREFIX}/activities`, activityRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;