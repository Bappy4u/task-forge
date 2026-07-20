"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Layers3,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

export type TaskType =
  | "IMAGE_RESIZE"
  | "VIDEO_CONVERT"
  | "PDF_GENERATION"
  | "EMAIL_SEND";

type FieldDefinition = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
};

type SubmissionState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  taskId?: string;
};

type TaskHistoryEntry = {
  id: string;
  type: TaskType;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
};

const taskOptions: { value: TaskType; label: string }[] = [
  { value: "IMAGE_RESIZE", label: "Image Resize" },
  { value: "VIDEO_CONVERT", label: "Video Conversion" },
  { value: "PDF_GENERATION", label: "PDF Generation" },
  { value: "EMAIL_SEND", label: "Send Email" },
];

const fieldDefinitions: Record<TaskType, FieldDefinition[]> = {
  IMAGE_RESIZE: [
    {
      name: "sourcePath",
      label: "Source image path",
      placeholder: "/images/photo.jpg",
    },
    {
      name: "width",
      label: "Target width",
      placeholder: "1920",
      type: "number",
    },
    {
      name: "height",
      label: "Target height",
      placeholder: "1080",
      type: "number",
    },
  ],
  VIDEO_CONVERT: [
    {
      name: "sourcePath",
      label: "Source video path",
      placeholder: "/videos/demo.mov",
    },
    {
      name: "outputPath",
      label: "Output path",
      placeholder: "/videos/demo.mp4",
    },
    { name: "format", label: "Output format", placeholder: "mp4" },
  ],
  PDF_GENERATION: [
    {
      name: "sourcePath",
      label: "Source document path",
      placeholder: "/docs/contract.docx",
    },
    {
      name: "outputPath",
      label: "Output PDF path",
      placeholder: "/docs/contract.pdf",
    },
  ],
  EMAIL_SEND: [
    {
      name: "recipientEmail",
      label: "Recipient email",
      placeholder: "team@example.com",
      type: "email",
    },
    { name: "subject", label: "Subject", placeholder: "Daily update" },
    {
      name: "body",
      label: "Message body",
      placeholder: "Your scheduled task is ready.",
    },
  ],
};

const buildInitialPayload = (taskType: TaskType) => {
  return fieldDefinitions[taskType].reduce<Record<string, string>>(
    (acc, field) => {
      acc[field.name] = "";
      return acc;
    },
    {},
  );
};

const getStatusConfig = (status: SubmissionState["status"]) => {
  switch (status) {
    case "loading":
      return {
        label: "Submitting",
        badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "success":
      return {
        label: "Accepted",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "error":
      return {
        label: "Needs attention",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      };
    default:
      return {
        label: "Draft",
        badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
      };
  }
};

export function TaskDashboard() {
  const [taskType, setTaskType] = useState<TaskType>("IMAGE_RESIZE");
  const [payload, setPayload] = useState<Record<string, string>>(() =>
    buildInitialPayload("IMAGE_RESIZE"),
  );
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: "Choose a task and queue it for background processing.",
  });
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<"home" | "all">("home");

  const fieldList = useMemo(() => fieldDefinitions[taskType], [taskType]);
  const selectedTaskLabel = useMemo(
    () =>
      taskOptions.find((option) => option.value === taskType)?.label ??
      taskType,
    [taskType],
  );
  const statusConfig = getStatusConfig(submission.status);
  const displayedTasks =
    activeView === "all" ? taskHistory : taskHistory.slice(0, 4);
  const hasTasks = taskHistory.length > 0;

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/tasks");

        if (!response.ok || cancelled) {
          return;
        }

        const parsed = (await response.json()) as {
          data?: Array<{
            id: string;
            type: string;
            status: TaskHistoryEntry["status"];
            createdAt: string;
          }>;
        };

        const nextTasks = (parsed.data ?? []).map((task) => ({
          id: task.id,
          type: (task.type as TaskType) ?? "IMAGE_RESIZE",
          status: task.status,
          createdAt: task.createdAt,
        }));

        if (!cancelled) {
          setTaskHistory(nextTasks.slice(0, 4));
        }
      } catch {
        // Ignore load errors and keep the current state visible.
      }
    };

    loadTasks();
    const interval = window.setInterval(loadTasks, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const handleTaskTypeChange = (value: TaskType) => {
    setTaskType(value);
    setPayload(buildInitialPayload(value));
    setSubmission({
      status: "idle",
      message: "Choose a task and queue it for background processing.",
    });
  };

  const handlePayloadChange = (fieldName: string, value: string) => {
    setPayload((current) => ({ ...current, [fieldName]: value }));
  };

  const upsertTaskHistoryEntry = (
    id: string,
    updates: Partial<TaskHistoryEntry>,
  ) => {
    setTaskHistory((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmission({
      status: "loading",
      message: "Submitting your task to the queue...",
    });

    const payloadToSend = Object.entries(payload).reduce<
      Record<string, string | number>
    >((acc, [key, value]) => {
      acc[key] = key === "width" || key === "height" ? Number(value) : value;
      return acc;
    }, {});

    const optimisticId = `task-${Date.now()}`;
    setTaskHistory((current) =>
      [
        {
          id: optimisticId,
          type: taskType,
          status: "queued",
          createdAt: new Date().toLocaleString(),
        },
        ...current,
      ].slice(0, 4),
    );

    try {
      const response = await fetch("http://localhost:8001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: taskType, payload: payloadToSend }),
      });

      if (!response.ok && response.status !== 202) {
        const errorBody = await response.text();
        let message = "The server rejected the request.";

        try {
          const parsed = errorBody ? JSON.parse(errorBody) : null;
          message = parsed?.message || parsed?.error || message;
        } catch {
          message = errorBody || message;
        }

        upsertTaskHistoryEntry(optimisticId, { status: "failed" });
        setSubmission({ status: "error", message });
        return;
      }

      const responseText = await response.text();
      let parsedBody: { data?: { taskId?: string }; taskId?: string } | null =
        null;

      if (responseText) {
        try {
          parsedBody = JSON.parse(responseText);
        } catch {
          parsedBody = null;
        }
      }

      const taskId =
        parsedBody?.data?.taskId || parsedBody?.taskId || optimisticId;

      upsertTaskHistoryEntry(optimisticId, {
        id: taskId,
        type: taskType,
        status: "queued",
      });

      setSubmission({
        status: "success",
        message: "Task queued successfully.",
        taskId,
      });

      const refreshed = await fetch("http://localhost:8001/api/tasks");
      if (refreshed.ok) {
        const parsedRefresh = (await refreshed.json()) as {
          data?: Array<{
            id: string;
            type: string;
            status: TaskHistoryEntry["status"];
            createdAt: string;
          }>;
        };

        const nextTasks = (parsedRefresh.data ?? []).map((task) => ({
          id: task.id,
          type: (task.type as TaskType) ?? "IMAGE_RESIZE",
          status: task.status,
          createdAt: task.createdAt,
        }));

        setTaskHistory(nextTasks.slice(0, 4));
      }
    } catch (error) {
      upsertTaskHistoryEntry(optimisticId, { status: "failed" });
      setSubmission({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the background API.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600">
            <Sparkles size={16} className="text-slate-900" />
            Background tasks
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Queue work with a calm, focused dashboard.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Create and review background jobs without the extra noise.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sparkles size={16} className="text-slate-900" />
            Task workspace
          </div>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeView === "home"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}>
              Home
            </button>
          </nav>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Task builder
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Create a new job
                </h2>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600">
                <Layers3 size={18} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="taskType"
                  className="text-sm font-medium text-slate-700">
                  Task Type
                </label>
                <select
                  id="taskType"
                  value={taskType}
                  onChange={(event) =>
                    handleTaskTypeChange(event.target.value as TaskType)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white">
                  {taskOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fieldList.map((field) => (
                  <div key={field.name} className="space-y-2 md:col-span-2">
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium text-slate-700">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={payload[field.name] ?? ""}
                      onChange={(event) =>
                        handlePayloadChange(field.name, event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submission.status === "loading"}>
                {submission.status === "loading" ? (
                  <>
                    <Clock3 size={16} className="animate-spin" />
                    Queuing task…
                  </>
                ) : (
                  <>
                    <SendHorizonal size={16} />
                    Submit task
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <Clock3 size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Queue status
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Live feedback
                  </h3>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {submission.status === "loading" && (
                  <div className="flex items-start gap-3">
                    <Clock3 size={18} className="mt-0.5 text-sky-600" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Task Queued
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                )}

                {submission.status === "success" && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Accepted for processing
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {submission.message}
                      </p>
                      {submission.taskId && (
                        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          <span className="font-semibold">Task ID:</span>{" "}
                          {submission.taskId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {submission.status === "error" && (
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Submission failed
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                )}

                {submission.status === "idle" && (
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="mt-0.5 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Ready to queue
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {activeView === "all" ? "All tasks" : "Recent tasks"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeView === "all"
                        ? "Browse the full task timeline from this workspace."
                        : "The latest jobs submitted from this dashboard."}
                    </p>
                  </div>
                </div>
                {activeView === "all" ? (
                  <button
                    type="button"
                    onClick={() => setActiveView("home")}
                    className="w-fit rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                    Back to home
                  </button>
                ) : hasTasks ? (
                  <button
                    type="button"
                    onClick={() => setActiveView("all")}
                    className="w-fit rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                    View all
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-2">
                {taskHistory.length > 0 ? (
                  displayedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {taskOptions.find(
                            (option) => option.value === task.type,
                          )?.label ?? task.type}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {task.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {task.id} • {task.createdAt}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No tasks yet. Submit one to see it appear here.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex justify-center pt-1 text-sm text-slate-500">
          <span>
            Made with love by{" "}
            <a
              href="https://bappy4u.github.io/"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-slate-700 hover:underline">
              Bappy
            </a>
            .
          </span>
        </footer>
      </div>
    </div>
  );
}
