import { type Request, type Response, type NextFunction } from "express";
import { catchAsync } from "../utils/catch.async.js";
import type { ICreateTaskInput, TaskType } from "../types/task.ts";
import { AppError } from "../utils/app.error.ts";

const ALLOWED_TASKS: TaskType[] = [
  "IMAGE_RESIZE",
  "VIDEO_CONVERT",
  "PDF_GENERATION",
  "EMAIL_SEND",
];

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

    // // 2. Add the job to the BullMQ background queue
    // // BullMQ will assign a unique job.id automatically
    // const job = await taskQueue.add(type, payload, {
    //   attempts: 3, // Automatically retry 3 times if the task fails
    //   backoff: 5000, // Wait 5 seconds between retries
    // });

    // // 3. Respond immediately with a 202 (Accepted for processing) status
    // res.status(202).json({
    //   success: true,
    //   message: "Task successfully scheduled for background execution.",
    //   data: {
    //     taskId: job.id,
    //     type: job.name,
    //     status: "queued",
    //   },
    // });
  },
);
