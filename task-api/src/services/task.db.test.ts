import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createTaskStore } from "./task.db.js";

test("persists and updates a task record", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "task-store-"));
  const dbPath = join(tempDir, "tasks.db");
  const store = createTaskStore(dbPath);

  try {
    const created = store.createTaskRecord({
      id: "job-1",
      type: "IMAGE_RESIZE",
      payload: { sourcePath: "/tmp/in.jpg" },
      status: "queued",
    });

    assert.equal(created.id, "job-1");
    assert.equal(created.status, "queued");

    const updated = store.updateTaskStatus("job-1", "processing", {
      attempts: 1,
    });

    assert.equal(updated?.status, "processing");
    assert.equal(updated?.attempts, 1);

    const fetched = store.getTaskById("job-1");
    assert.equal(fetched?.status, "processing");
    assert.equal(fetched?.attempts, 1);
  } finally {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});
