import http from 'http';
import app from './app';
import { config } from './config/env';
import { checkDbConnection } from './db';
import redis from './config/redis';
import { createEmailWorker } from './queues/email.worker';
import { initSocketServer } from './socket';

async function bootstrap(): Promise<void> {
  try {
    await checkDbConnection();
    await redis.connect();

    // Create HTTP server from Express app
    // Socket.io attaches to this, not to Express directly
    const httpServer = http.createServer(app);

    // start background worker
    const emailWorker = createEmailWorker();
    console.log('⚙️  Email worker started');

    // Initialize Socket.io
    initSocketServer(httpServer);

    // graceful shut down - drain worker before exit
    process.on('SIGTERM', async () => {
      console.log('shutting down.....');
      await emailWorker.close();
      process.exit(0);
    })
    
    // Listen on httpServer, not app
    httpServer.listen(config.port, () => {
      console.log(`🚀 DevFlow API running on http://localhost:${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();