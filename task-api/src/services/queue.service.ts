import { Queue, QueueScheduler } from "bullmq";
import { env } from "../config/env.js";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

export const taskQueueScheduler = new QueueScheduler("task-queue", {
  connection,
});

export const taskQueue = new Queue("task-queue", {
  connection,
});
