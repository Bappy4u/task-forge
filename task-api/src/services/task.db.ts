import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

export type TaskStatus = "queued" | "processing" | "completed" | "failed";

export interface TaskRecord {
  id: string;
  type: string;
  payload: string;
  status: TaskStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

export interface CreateTaskRecordInput {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: TaskStatus;
  attempts?: number;
  error?: string | null;
}

const DEFAULT_DB_PATH = resolve(process.cwd(), "data", "tasks.db");

export const createTaskStore = (dbPath = DEFAULT_DB_PATH) => {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      completedAt TEXT,
      error TEXT
    );
  `);

  const createTaskRecord = (input: CreateTaskRecordInput): TaskRecord => {
    const now = new Date().toISOString();
    const record = {
      id: input.id,
      type: input.type,
      payload: JSON.stringify(input.payload ?? {}),
      status: input.status,
      attempts: input.attempts ?? 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      error: input.error ?? null,
    };

    db.prepare(
      `
        INSERT INTO tasks (id, type, payload, status, attempts, createdAt, updatedAt, completedAt, error)
        VALUES (@id, @type, @payload, @status, @attempts, @createdAt, @updatedAt, @completedAt, @error)
        ON CONFLICT(id) DO NOTHING
      `,
    ).run(record);

    return getTaskById(record.id)!;
  };

  const getTaskById = (id: string): TaskRecord | undefined => {
    const row = db
      .prepare(
        `
          SELECT id, type, payload, status, attempts, createdAt, updatedAt, completedAt, error
          FROM tasks
          WHERE id = ?
        `,
      )
      .get(id) as TaskRecord | undefined;

    return row ? { ...row, payload: row.payload } : undefined;
  };

  const getAllTasks = (): TaskRecord[] => {
    return (
      db
        .prepare(
          `
            SELECT id, type, payload, status, attempts, createdAt, updatedAt, completedAt, error
            FROM tasks
            ORDER BY createdAt DESC
          `,
        )
        .all() as TaskRecord[]
    ).map((row) => ({ ...row, payload: row.payload }));
  };

  const updateTaskStatus = (
    id: string,
    status: TaskStatus,
    overrides: Partial<Pick<TaskRecord, "attempts" | "error">> = {},
  ): TaskRecord | undefined => {
    const now = new Date().toISOString();
    const completedAt =
      status === "completed" || status === "failed" ? now : null;

    const updated = db
      .prepare(
        `
        UPDATE tasks
        SET status = ?, attempts = COALESCE(?, attempts), updatedAt = ?, completedAt = ?, error = COALESCE(?, error)
        WHERE id = ?
      `,
      )
      .run(
        status,
        overrides.attempts ?? null,
        now,
        completedAt,
        overrides.error ?? null,
        id,
      );

    if (updated.changes === 0) {
      return undefined;
    }

    return getTaskById(id);
  };

  return {
    createTaskRecord,
    getTaskById,
    getAllTasks,
    updateTaskStatus,
    close: () => db.close(),
  };
};

export const taskStore = createTaskStore();
