import { type Request, type Response, type NextFunction } from "express";
import { catchAsync } from "../utils/catch.async.js";
import { AppError } from "../utils/app.error.ts";
import { taskQueue } from "../services/queue.service.js";
import { taskStore } from "../services/task.db.js";
import type { ICreateTaskInput } from "../types/task.ts";
import { TASK_TYPES, TaskType } from "../types/task.ts";

const ALLOWED_TASKS: TaskType[] = TASK_TYPES;

export const listTasks = catchAsync(async (_req: Request, res: Response) => {
  const tasks = taskStore.getAllTasks();

  res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const createTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { type, payload } = req.body as ICreateTaskInput;

    if (!type || !payload) {
      return next(
        new AppError("Task type and payload parameters are required.", 400),
      );
    }

    if (!ALLOWED_TASKS.includes(type)) {
      return next(
        new AppError(
          `Invalid task type. Must be one of: ${ALLOWED_TASKS.join(", ")}`,
          400,
        ),
      );
    }

    const job = await taskQueue.add(type, payload, {
      attempts: 3,
      backoff: {
        type: "fixed",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    const taskId = job.id ?? `task-${Date.now()}`;
    taskStore.createTaskRecord({
      id: taskId,
      type,
      payload,
      status: "queued",
    });

    res.status(202).json({
      success: true,
      message: "Task successfully scheduled for background execution.",
      data: {
        taskId,
        type: job.name,
        status: "queued",
      },
    });
  },
);
