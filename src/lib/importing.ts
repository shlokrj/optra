import type { ApplicationInput } from "@/lib/actions";
import type { Status } from "@/lib/constants";

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, newlines in quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  row.push(field);
  rows.push(row);
  // Drop fully empty trailing rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const IMPORT_FIELDS = [
  { key: "skip", label: "— Skip —" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role / Position" },
  { key: "status", label: "Status" },
  { key: "dateApplied", label: "Date applied" },
  { key: "deadline", label: "Deadline" },
  { key: "season", label: "Season / Term" },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "url", label: "Job posting URL" },
  { key: "portalUrl", label: "Applicant portal" },
  { key: "resume", label: "Resume version" },
  { key: "coverLetter", label: "Cover letter" },
  { key: "referral", label: "Referral (yes/no)" },
  { key: "notes", label: "Notes / Details" },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

/**
 * Find the most likely header row: the first row that names a company column
 * and a role-ish column. Spreadsheet exports often have title/summary rows
 * above the real header.
 */
export function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const cells = rows[i].map((c) => c.trim().toLowerCase());
    const hasCompany = cells.some((c) => c.includes("company"));
    const hasRole = cells.some(
      (c) =>
        c.includes("position") || c.includes("role") || c.includes("title"),
    );
    if (hasCompany && hasRole) return i;
  }
  return 0;
}

export function guessFieldForHeader(header: string): ImportFieldKey {
  const h = header.trim().toLowerCase();
  if (!h) return "skip";
  if (h.includes("company") || h.includes("employer")) return "company";
  if (h.includes("position") || h.includes("role") || h.includes("title"))
    return "role";
  if (h.includes("status")) return "status";
  if (h.includes("deadline") || h.includes("due")) return "deadline";
  if (h.includes("date")) return "dateApplied";
  if (h.includes("season") || h.includes("term") || h.includes("cycle"))
    return "season";
  if (h.includes("category") || h === "type") return "category";
  if (h.includes("location") || h.includes("city")) return "location";
  if (h.includes("portal")) return "portalUrl";
  if (h.includes("url") || h.includes("link") || h.includes("posting"))
    return "url";
  if (h.includes("resume") || h.includes("cv")) return "resume";
  if (h.includes("cover")) return "coverLetter";
  if (h.includes("referral") || h.includes("referred")) return "referral";
  if (h.includes("detail") || h.includes("note") || h.includes("comment"))
    return "notes";
  return "skip";
}

export function normalizeStatus(raw: string, hasDateApplied: boolean): Status {
  const s = raw.trim().toLowerCase();
  const fallback: Status = hasDateApplied ? "applied" : "saved";
  if (!s) return fallback;
  if (s.includes("reject") || s.includes("declin")) return "rejected";
  if (s.includes("offer") || s.includes("accept")) return "offer";
  if (s.includes("interview") || s.includes("progress") || s.includes("phone"))
    return "interviewing";
  if (
    s.includes("assessment") ||
    s.includes("challenge") ||
    s.includes("hackerrank") ||
    s.includes("codesignal") ||
    /\boa\b/.test(s)
  )
    return "oa";
  if (s.includes("ghost") || s.includes("no response")) return "ghosted";
  if (s.includes("withdraw")) return "withdrawn";
  if (s.includes("appl") || s.includes("submit") || s.includes("sent"))
    return "applied";
  if (s.includes("save") || s.includes("bookmark") || s.includes("todo"))
    return "saved";
  return fallback;
}

/** Parse "5/21/26", "6/3", "6/9/2026", or ISO into "YYYY-MM-DD". */
export function toISODate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    let year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const mm = String(parseInt(m[1], 10)).padStart(2, "0");
    const dd = String(parseInt(m[2], 10)).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  return "";
}

/** Pull "Summer 2027" / "Fall '26" style season mentions out of free text. */
export function extractSeason(text: string): string {
  const m = text.match(/(spring|summer|fall|autumn|winter)\s*'?\s*(\d{2,4})/i);
  if (!m) return "";
  let term =
    m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  if (term === "Autumn") term = "Fall";
  let year = parseInt(m[2], 10);
  if (year < 100) year += 2000;
  return `${term} ${year}`;
}

export function guessCategory(role: string): string {
  const r = role.toLowerCase();
  if (/\b(ai|ml|llm)\b|machine.?learning|deep.?learning|intelligence/.test(r))
    return "AI/ML";
  if (/\bdata\b|analytics|analyst/.test(r)) return "Data";
  if (/quant|trading/.test(r)) return "Quant";
  if (/research/.test(r)) return "Research";
  if (
    /software|swe|sde|engineer|developer|full.?stack|backend|frontend|front.?end|back.?end|mobile|infra|platform|systems|cloud|devops/.test(
      r,
    )
  )
    return "SWE";
  return "Other";
}

function truthy(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return ["yes", "y", "true", "1", "x", "✓"].includes(s);
}

/**
 * Turn parsed CSV rows + a column→field mapping into application inputs.
 * Rows without a company are skipped.
 */
export function buildApplications(
  dataRows: string[][],
  mapping: Record<number, ImportFieldKey>,
): ApplicationInput[] {
  const out: ApplicationInput[] = [];
  for (const cells of dataRows) {
    const raw: Partial<Record<ImportFieldKey, string>> = {};
    for (const [colStr, field] of Object.entries(mapping)) {
      if (field === "skip") continue;
      const value = (cells[Number(colStr)] ?? "").trim();
      if (!value) continue;
      // Concatenate when two columns map to the same field (e.g. two note columns)
      raw[field] = raw[field] ? `${raw[field]} — ${value}` : value;
    }
    const company = raw.company ?? "";
    if (!company) continue;

    const role = raw.role || "Unknown role";
    const dateApplied = toISODate(raw.dateApplied ?? "");
    const notes = raw.notes ?? "";
    const season =
      raw.season?.trim() || extractSeason(notes) || extractSeason(role);

    out.push({
      company,
      role,
      status: normalizeStatus(raw.status ?? "", dateApplied !== ""),
      category: raw.category?.trim() || guessCategory(role),
      season,
      location: raw.location ?? "",
      url: raw.url ?? "",
      portalUrl: raw.portalUrl ?? "",
      dateApplied,
      deadline: toISODate(raw.deadline ?? ""),
      referral: truthy(raw.referral ?? ""),
      resume: raw.resume ?? "",
      coverLetter: raw.coverLetter ?? "",
      notes,
    });
  }
  return out;
}
