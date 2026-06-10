export const STATUSES = [
  "saved",
  "applied",
  "oa",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  oa: "Online Assessment",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
};

export const STATUS_SHORT_LABELS: Record<Status, string> = {
  ...STATUS_LABELS,
  oa: "OA",
};

// Badge + accent styling per status (Tailwind classes).
export const STATUS_STYLES: Record<Status, { badge: string; dot: string }> = {
  saved: {
    badge: "bg-slate-200/80 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  applied: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  oa: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  interviewing: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  offer: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  ghosted: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  withdrawn: {
    badge: "bg-slate-200/80 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
};

// Statuses that count as "still in the running".
export const ACTIVE_STATUSES: Status[] = ["applied", "oa", "interviewing"];

// Statuses where the company responded in some way.
export const RESPONDED_STATUSES: Status[] = [
  "oa",
  "interviewing",
  "offer",
  "rejected",
];

export const CATEGORIES = [
  "SWE",
  "Data",
  "AI/ML",
  "Quant",
  "Research",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Season options like "Summer 2027", generated around the current year. */
export function seasonOptions(): string[] {
  const year = new Date().getFullYear();
  const out: string[] = [];
  for (let y = year; y <= year + 2; y++) {
    for (const term of ["Spring", "Summer", "Fall", "Winter"]) {
      out.push(`${term} ${y}`);
    }
  }
  return out;
}
