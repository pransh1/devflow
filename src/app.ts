import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { config } from './config/env';
import { AppError } from './utils/AppError';
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';
import issuesRoutes from './modules/issues/issues.routes';

const app: Application = express();

// security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check 
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: config.nodeEnv, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/workspaces/:workspaceId', issuesRoutes);

// 404 handler — catches any route we haven't defined
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Zod validation error
  if(err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'validation error',
      errors: err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // our custom error
  if(err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown errors
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });

});

export default app;