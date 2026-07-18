// src/config/env.ts
import dotenv from "dotenv";

// Load the .env file from the root directory
dotenv.config();

const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6500", 10);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8001", 10),
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT,
  REDIS_URL:
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${REDIS_PORT}`,
};
