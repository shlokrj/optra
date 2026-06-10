"use server";

import { db } from "@/db";
import { applications, type Application } from "@/db/schema";
import { STATUSES, CATEGORIES, type Status } from "@/lib/constants";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ApplicationInput = {
  company: string;
  role: string;
  status: string;
  category: string;
  season: string;
  location: string;
  url: string;
  portalUrl: string;
  dateApplied: string;
  deadline: string;
  referral: boolean;
  resume: string;
  coverLetter: string;
  notes: string;
};

function sanitize(input: ApplicationInput) {
  const status = STATUSES.includes(input.status as Status)
    ? input.status
    : "saved";
  const category = (CATEGORIES as readonly string[]).includes(input.category)
    ? input.category
    : "Other";
  return {
    company: input.company.trim(),
    role: input.role.trim(),
    status,
    category,
    season: input.season.trim(),
    location: input.location.trim(),
    url: input.url.trim(),
    portalUrl: input.portalUrl.trim(),
    dateApplied: input.dateApplied.trim(),
    deadline: input.deadline.trim(),
    referral: input.referral,
    resume: input.resume.trim(),
    coverLetter: input.coverLetter.trim(),
    notes: input.notes.trim(),
  };
}

export async function createApplication(input: ApplicationInput) {
  const data = sanitize(input);
  if (!data.company || !data.role) {
    return { ok: false as const, error: "Company and role are required." };
  }
  const now = new Date().toISOString();
  db.insert(applications)
    .values({ ...data, createdAt: now, updatedAt: now })
    .run();
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateApplication(id: number, input: ApplicationInput) {
  const data = sanitize(input);
  if (!data.company || !data.role) {
    return { ok: false as const, error: "Company and role are required." };
  }
  db.update(applications)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(applications.id, id))
    .run();
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateStatus(id: number, status: Status) {
  if (!STATUSES.includes(status)) {
    return { ok: false as const, error: "Invalid status." };
  }
  db.update(applications)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(applications.id, id))
    .run();
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteApplication(id: number) {
  db.delete(applications).where(eq(applications.id, id)).run();
  revalidatePath("/");
  return { ok: true as const };
}

export async function importApplications(rows: ApplicationInput[]) {
  const now = new Date().toISOString();
  const valid = rows
    .map(sanitize)
    .filter((r) => r.company && r.role)
    .map((r) => ({ ...r, createdAt: now, updatedAt: now }));
  if (valid.length === 0) {
    return { ok: false as const, error: "No valid rows to import.", count: 0 };
  }
  db.transaction((tx) => {
    for (const row of valid) {
      tx.insert(applications).values(row).run();
    }
  });
  revalidatePath("/");
  return { ok: true as const, count: valid.length };
}

export async function getApplications(): Promise<Application[]> {
  return db.select().from(applications).all();
}
