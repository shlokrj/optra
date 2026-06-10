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
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-400",
  },
  applied: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
  },
  oa: {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot: "bg-violet-400",
  },
  interviewing: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  offer: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  rejected: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
  },
  ghosted: {
    badge: "bg-stone-500/10 text-stone-400 border-stone-500/20",
    dot: "bg-stone-400",
  },
  withdrawn: {
    badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    dot: "bg-zinc-500",
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
