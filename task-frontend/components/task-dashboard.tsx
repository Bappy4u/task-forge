"use client";

import { useMemo, useState } from "react";
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

export function TaskDashboard() {
  const [taskType, setTaskType] = useState<TaskType>("IMAGE_RESIZE");
  const [payload, setPayload] = useState<Record<string, string>>(() =>
    buildInitialPayload("IMAGE_RESIZE"),
  );
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: "Choose a task and queue it for background processing.",
  });

  const fieldList = useMemo(() => fieldDefinitions[taskType], [taskType]);

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
        parsedBody?.data?.taskId || parsedBody?.taskId || `task-${Date.now()}`;

      setSubmission({
        status: "success",
        message: "Task queued successfully.",
        taskId,
      });
    } catch (error) {
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_45%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <Sparkles size={16} className="text-sky-600" />
            Background Task Control Center
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Queue work without blocking the main experience.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Create background tasks for image processing, media conversion,
              document generation, and email delivery from a single dashboard.
            </p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                  Task Builder
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Create a new job
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                <Layers3 size={20} />
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white">
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white"
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
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
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Queue Status
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Live feedback
                  </h3>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-xl shadow-slate-300/40">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                API endpoint
              </p>
              <p className="mt-3 text-lg font-semibold">
                POST http://localhost:8001/api/tasks
              </p>
              <p className="mt-2 text-sm text-slate-400">
                The form sends a JSON payload with the selected task type and
                its required fields.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
