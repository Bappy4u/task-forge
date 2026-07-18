// src/config/env.ts
import dotenv from "dotenv";

// Load the .env file from the root directory
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8001", 10),
};
