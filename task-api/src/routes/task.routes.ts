import { Router } from "express";
import { createTask } from "../controllers/task.controller.ts";

const router = Router();

/**
 * @route   POST /api/tasks
 * @desc    Submit a new background task (Image Resize, Video Convert, etc.)
 * @access  Public (or add Auth middleware here later)
 */
router.post("/", createTask);

export default router;
