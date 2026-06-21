import app from './app';
import { config } from './config/env';
import { checkDbConnection } from './db';
import redis from './config/redis';

async function bootstrap(): Promise<void> {
  try {
    await checkDbConnection();
    await redis.connect();
    
    app.listen(config.port, () => {
      console.log(`🚀 DevFlow API running on http://localhost:${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();