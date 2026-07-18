import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import taskRouter from "./routes/task.routes.js";
import { errorHandler } from "./middlewares/error.middleware.ts";

const app: Express = express();
const pino = pinoHttp({
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true, // Add colors for log levels (green for info, red for error)
            ignore: "pid,hostname,req,res,responseTime",
            translateTime: "HH:MM:ss", // Make timestamps readable (e.g., 14:32:01)
          },
        }
      : undefined, // Falls back to raw ultra-fast JSON in production
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "silent"; // <-- Hides the automatic "request completed" message for successful requests!
  },
});

app.use(cors());
app.use(express.json());
app.use(pino);

app.use("/api/tasks", taskRouter);

app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  req.log.info("Received request to root endpoint"); // Log the request
  res.send("Hello World!");
});

export default app;
