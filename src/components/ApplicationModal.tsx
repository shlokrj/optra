"use client";

import { useEffect, useState, useTransition } from "react";
import type { Application } from "@/db/schema";
import {
  createApplication,
  deleteApplication,
  updateApplication,
  type ApplicationInput,
} from "@/lib/actions";
import {
  CATEGORIES,
  STATUSES,
  STATUS_LABELS,
  seasonOptions,
  type Status,
} from "@/lib/constants";

type Props = {
  app: Application | null; // null = creating a new application
  onClose: () => void;
};

const EMPTY: ApplicationInput = {
  company: "",
  role: "",
  status: "saved",
  category: "SWE",
  season: "",
  location: "",
  url: "",
  portalUrl: "",
  dateApplied: "",
  deadline: "",
  referral: false,
  resume: "",
  coverLetter: "",
  notes: "",
};

function inputFrom(app: Application): ApplicationInput {
  return {
    company: app.company,
    role: app.role,
    status: app.status,
    category: app.category,
    season: app.season,
    location: app.location,
    url: app.url,
    portalUrl: app.portalUrl,
    dateApplied: app.dateApplied,
    deadline: app.deadline,
    referral: app.referral,
    resume: app.resume,
    coverLetter: app.coverLetter,
    notes: app.notes,
  };
}

const inputClass =
  "w-full rounded-md border border-zinc-700/80 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 " +
  "placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50";

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export default function ApplicationModal({ app, onClose }: Props) {
  const [form, setForm] = useState<ApplicationInput>(
    app ? inputFrom(app) : EMPTY,
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = app
        ? await updateApplication(app.id, form)
        : await createApplication(form);
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  const remove = () => {
    if (!app) return;
    if (!confirm(`Delete ${app.company} — ${app.role}?`)) return;
    startTransition(async () => {
      await deleteApplication(app.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:py-12"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <form onSubmit={submit}>
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-100">
              {app ? "Edit application" : "New application"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <Field label="Company *">
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. NVIDIA"
                autoFocus={!app}
                required
              />
            </Field>
            <Field label="Role *">
              <input
                className={inputClass}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. SWE Intern, AI Infrastructure"
                required
              />
            </Field>

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s as Status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Season">
              <input
                className={inputClass}
                list="season-options"
                value={form.season}
                onChange={(e) => set("season", e.target.value)}
                placeholder="e.g. Summer 2027"
              />
              <datalist id="season-options">
                {seasonOptions().map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Madison, WI / Remote"
              />
            </Field>

            <Field label="Date applied">
              <input
                type="date"
                className={inputClass}
                value={form.dateApplied}
                onChange={(e) => set("dateApplied", e.target.value)}
              />
            </Field>
            <Field label="Deadline">
              <input
                type="date"
                className={inputClass}
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
              />
            </Field>

            <Field label="Job posting URL" span>
              <input
                className={inputClass}
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Applicant portal" span>
              <input
                className={inputClass}
                value={form.portalUrl}
                onChange={(e) => set("portalUrl", e.target.value)}
                placeholder="https://… (where you check your status)"
              />
            </Field>

            <Field label="Resume version">
              <input
                className={inputClass}
                value={form.resume}
                onChange={(e) => set("resume", e.target.value)}
                placeholder="e.g. swe-v3"
              />
            </Field>
            <Field label="Cover letter">
              <input
                className={inputClass}
                value={form.coverLetter}
                onChange={(e) => set("coverLetter", e.target.value)}
                placeholder="Link or note"
              />
            </Field>

            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.referral}
                onChange={(e) => set("referral", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-indigo-500"
              />
              <span className="text-sm text-zinc-300">I have a referral</span>
            </label>

            <Field label="Notes" span>
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Anything worth remembering — recruiter names, OA details, follow-ups…"
              />
            </Field>
          </div>

          {error && (
            <p className="px-5 pb-2 text-sm text-rose-400">{error}</p>
          )}

          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4">
            <div>
              {app && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="rounded-md px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {pending ? "Saving…" : app ? "Save changes" : "Add application"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
