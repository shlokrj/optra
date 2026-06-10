import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("saved"),
  category: text("category").notNull().default("SWE"),
  season: text("season").notNull().default(""),
  location: text("location").notNull().default(""),
  url: text("url").notNull().default(""),
  portalUrl: text("portal_url").notNull().default(""),
  dateApplied: text("date_applied").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  referral: integer("referral", { mode: "boolean" }).notNull().default(false),
  resume: text("resume").notNull().default(""),
  coverLetter: text("cover_letter").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
