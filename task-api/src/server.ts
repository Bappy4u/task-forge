import app from "./app.js"; // Note: Use .js extension if you went with ESM in the previous step
import { env } from "./config/env.js";

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server booting up on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection! Shutting down...", err);
  process.exit(1);
});
