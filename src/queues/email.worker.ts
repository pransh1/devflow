import { Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { sendWelcomeEmail, sendInviteEmail } from '../services/email.service';
import type { EmailJobData } from './email.queue';

// Parse the Redis URL into host/port for BullMQ
// BullMQ needs its own connection config, not our ioredis instance
const redisConnection = {
  host: new URL(config.redis.url).hostname,
  port: parseInt(new URL(config.redis.url).port || '6379', 10),
};

export function createEmailWorker() {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
      console.log(`📬 Processing email job: ${job.name} (id: ${job.id})`);

      const { data } = job;

      switch(data.type) {
        case 'welcome':
          await sendWelcomeEmail({ to: data.to, username: data.username });
          break;
        case 'invite': 
          await sendInviteEmail({
            to: data.to,
            inviteeName: data.inviteeName,
            workspaceName: data.workspaceName,
            inviterName: data.inviterName
          })
          break;
        default:
          throw new Error(`Unknown email job type`);
      }
      console.log(`✅ Email job completed: ${job.name} (id: ${job.id})`);
    },
    {
      connection: redisConnection, 
      concurrency: 5,
    }
  );
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job?.name} (id: ${job?.id})`, err.message);
  });
  worker.on('error', (err) => {
    console.error('Email worker error:', err);
  });

  return worker;
};