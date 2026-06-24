// Override the db import to use testDb
// We do this by setting env before importing
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 
  'postgresql://localhost:5432/devflow_test';


import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import authRoutes from '../modules/auth/auth.routes';
import workspaceRoutes from '../modules/workspace/workspace.routes';
import issuesRoutes from '../modules/issues/issues.routes';


const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/workspaces/:workspaceId', issuesRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;