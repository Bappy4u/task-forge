import { Job, Worker } from "bullmq";
import { env } from "../config/env.js";
import { taskStore } from "../services/task.db.js";
import { TaskType } from "../types/task.js";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

const processTask = async (job: Job) => {
  const taskId = job.id ?? `task-${Date.now()}`;

  taskStore.updateTaskStatus(taskId, "processing", {
    attempts: job.attemptsMade + 1,
  });

  console.log(`\n[worker] job ${taskId} started`, {
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
  const taskId = job.id ?? `task-${Date.now()}`;
  taskStore.updateTaskStatus(taskId, "completed");
  console.log(`[worker] completed ${taskId} (${job.name})`);
});

worker.on("failed", (job, err) => {
  const taskId = job?.id ?? `task-${Date.now()}`;
  taskStore.updateTaskStatus(taskId, "failed", {
    error: err.message,
  });
  console.error(`[worker] failed ${taskId} (${job?.name})`, err);
});

worker.on("error", (err) => {
  console.error("[worker] BullMQ error", err);
});

console.log(
  `[worker] BullMQ task processor started on redis://${connection.host}:${connection.port}`,
);
