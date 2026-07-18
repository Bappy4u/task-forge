import { Job, QueueScheduler, Worker } from "bullmq";
import { env } from "../config/env.js";
import { TaskType } from "../types/task.js";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

new QueueScheduler("task-queue", {
  connection,
});

const processTask = async (job: Job) => {
  console.log(`\n[worker] job ${job.id} started`, {
    type: job.name,
    data: job.data,
  });

  switch (job.name as TaskType) {
    case TaskType.IMAGE_RESIZE:
      console.log("[worker] IMAGE_RESIZE payload:", job.data);
      break;
    case TaskType.VIDEO_CONVERT:
      console.log("[worker] VIDEO_CONVERT payload:", job.data);
      break;
    case TaskType.PDF_GENERATION:
      console.log("[worker] PDF_GENERATION payload:", job.data);
      break;
    case TaskType.EMAIL_SEND:
      console.log("[worker] EMAIL_SEND payload:", job.data);
      break;
    default:
      throw new Error(`Unsupported task type: ${job.name}`);
  }

  return {
    completedAt: new Date().toISOString(),
    processedType: job.name,
  };
};

const worker = new Worker("task-queue", processTask, {
  connection,
});

worker.on("completed", (job) => {
  console.log(`[worker] completed ${job.id} (${job.name})`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed ${job?.id} (${job?.name})`, err);
});

worker.on("error", (err) => {
  console.error("[worker] BullMQ error", err);
});

console.log(
  `[worker] BullMQ task processor started on redis://${connection.host}:${connection.port}`,
);
