"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ListChecks, Sparkles } from "lucide-react";

export type TaskType =
  | "IMAGE_RESIZE"
  | "VIDEO_CONVERT"
  | "PDF_GENERATION"
  | "EMAIL_SEND";

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

export function TaskListPage() {
  const [tasks, setTasks] = useState<TaskHistoryEntry[]>([]);

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
          setTasks(nextTasks);
        }
      } catch {
        // Ignore errors and keep the empty state visible.
      }
    };

    loadTasks();
    const interval = window.setInterval(loadTasks, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sparkles size={16} className="text-slate-900" />
            Task list
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            <ArrowLeft size={15} />
            Back home
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <ListChecks size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">All tasks</p>
              <p className="mt-1 text-sm text-slate-500">
                A dedicated page for the complete task history.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {taskOptions.find((option) => option.value === task.type)
                        ?.label ?? task.type}
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
                No tasks yet. Submit one from the home page to populate this
                list.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
