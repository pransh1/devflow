import { Queue } from "bullmq";
import { config } from "../config/env";
import redis from "../config/redis";

// Parse the Redis URL into host/port for BullMQ
// BullMQ needs its own connection config, not our ioredis instance
const redisConnection = {
  host: new URL(config.redis.url).hostname,
  port: parseInt(new URL(config.redis.url).port || '6379', 10),
};


// All possible email job types
export type EmailJobName = 'welcome' | 'invite';

// Job data shapes per job
export interface WelcomeJobData {
  type: 'welcome';
  to: string;
  username: string;
};

export interface InviteJobData {
  type: 'invite';
  to: string;
  inviteeName: string;
  workspaceName: string;
  inviterName: string;
};

export type EmailJobData = WelcomeJobData | InviteJobData;

// The queue - shared across the app
export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,              // retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 2000,            // 2s, 4s, 8s between retries
    },
    removeOnComplete: 100,    // keep last 100 completed jobs
    removeOnFail: 50          // keep last 50 failed jobs
  },
});