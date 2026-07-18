import { Queue } from "bullmq";
import { env } from "../config/env.js";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

export const taskQueue = new Queue("task-queue", {
  connection,
});
