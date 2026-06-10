"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Application } from "@/db/schema";
import { updateStatus } from "@/lib/actions";
import {
  ACTIVE_STATUSES,
  RESPONDED_STATUSES,
  STATUSES,
  STATUS_LABELS,
  STATUS_SHORT_LABELS,
  STATUS_STYLES,
  type Status,
} from "@/lib/constants";
import { formatDate, isHttpUrl } from "@/lib/format";
import ApplicationModal from "@/components/ApplicationModal";

type SortKey = "dateApplied" | "company" | "updatedAt";

type Props = { apps: Application[] };

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3h7v7M13 3L7 9M11 9v3.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5H7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard({ apps }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | Status>(
    "all",
  );
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dateApplied");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [modal, setModal] = useState<{ app: Application | null } | null>(null);
  const [, startTransition] = useTransition();

  const seasons = useMemo(
    () =>
      Array.from(new Set(apps.map((a) => a.season).filter(Boolean))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [apps],
  );
  const categories = useMemo(
    () => Array.from(new Set(apps.map((a) => a.category).filter(Boolean))),
    [apps],
  );

  const stats = useMemo(() => {
    const total = apps.length;
    const active = apps.filter((a) =>
      ACTIVE_STATUSES.includes(a.status as Status),
    ).length;
    const offers = apps.filter((a) => a.status === "offer").length;
    const rejected = apps.filter((a) => a.status === "rejected").length;
    const submitted = apps.filter(
      (a) => a.status !== "saved" && a.status !== "withdrawn",
    ).length;
    const responded = apps.filter((a) =>
      RESPONDED_STATUSES.includes(a.status as Status),
    ).length;
    const responseRate =
      submitted > 0 ? Math.round((responded / submitted) * 100) : null;
    return { total, active, offers, rejected, responseRate };
  }, [apps]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of apps) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
    return counts;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = apps.filter((a) => {
      if (statusFilter === "active") {
        if (!ACTIVE_STATUSES.includes(a.status as Status)) return false;
      } else if (statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }
      if (seasonFilter !== "all" && a.season !== seasonFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter)
        return false;
      if (q) {
        const haystack =
          `${a.company} ${a.role} ${a.location} ${a.notes}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp: number;
      if (sortKey === "company") {
        cmp = a.company.localeCompare(b.company);
      } else {
        const av = a[sortKey] || (sortDir === "asc" ? "￿" : "");
        const bv = b[sortKey] || (sortDir === "asc" ? "￿" : "");
        cmp = av.localeCompare(bv);
      }
      if (cmp === 0) cmp = a.id - b.id;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [apps, query, statusFilter, seasonFilter, categoryFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "company" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const changeStatus = (id: number, status: Status) => {
    startTransition(async () => {
      await updateStatus(id, status);
    });
  };

  const selectClass =
    "rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-900 " +
    "focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200";

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          No applications yet
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Add your first opportunity, or import everything from your existing
          spreadsheet to get going in one shot.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setModal({ app: null })}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            + Add application
          </button>
          <Link
            href="/import"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Import from CSV
          </Link>
        </div>
        {modal && (
          <ApplicationModal app={modal.app} onClose={() => setModal(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total tracked" value={stats.total} />
        <StatCard label="Active pipeline" value={stats.active} accent="text-emerald-600" />
        <StatCard label="Offers" value={stats.offers} accent="text-emerald-600" />
        <StatCard label="Rejected" value={stats.rejected} accent="text-rose-500" />
        <StatCard
          label="Response rate"
          value={stats.responseRate === null ? "—" : `${stats.responseRate}%`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, role, notes…"
          className="w-full max-w-xs rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
        />
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setModal({ app: null })}
            className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 shadow-sm"
          >
            + Add application
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", `All · ${apps.length}`],
            ["active", `Active · ${stats.active}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === key
                ? "border-emerald-400/50 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-950"
            }`}
          >
            {label}
          </button>
        ))}
        {STATUSES.map((s) => {
          const count = statusCounts.get(s) ?? 0;
          if (count === 0) return null;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? "all" : s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? STATUS_STYLES[s].badge
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-950"
              }`}
            >
              {STATUS_SHORT_LABELS[s]} · {count}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-175 text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th
                className="cursor-pointer select-none px-4 py-2.5 font-medium hover:text-slate-950"
                onClick={() => toggleSort("company")}
              >
                Company{sortIndicator("company")}
              </th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Season</th>
              <th
                className="cursor-pointer select-none px-4 py-2.5 font-medium hover:text-slate-950"
                onClick={() => toggleSort("dateApplied")}
              >
                Applied{sortIndicator("dateApplied")}
              </th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Links</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => {
              const style = STATUS_STYLES[app.status as Status];
              return (
                <tr
                  key={app.id}
                  onClick={() => setModal({ app })}
                  className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-950">
                      {app.company}
                    </span>
                    {app.referral && (
                      <span
                        title="Referral"
                        className="ml-1.5 text-xs text-emerald-600"
                      >
                        ★
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{app.role}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {[app.category, app.location].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {app.season || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(app.dateApplied)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={app.status}
                      onChange={(e) =>
                        changeStatus(app.id, e.target.value as Status)
                      }
                      className={`cursor-pointer appearance-none rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-900 focus:outline-none ${style?.badge ?? ""}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900">
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 text-slate-500">
                      {isHttpUrl(app.url) && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Job posting"
                          className="hover:text-emerald-600"
                        >
                          <ExternalIcon />
                        </a>
                      )}
                      {isHttpUrl(app.portalUrl) && (
                        <a
                          href={app.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Applicant portal"
                          className="hover:text-emerald-600"
                        >
                          <ExternalIcon />
                        </a>
                      )}
                      {!isHttpUrl(app.url) && !isHttpUrl(app.portalUrl) && "—"}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  Nothing matches the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} of {apps.length} applications shown · click a row to
        edit
      </p>

      {modal && (
        <ApplicationModal app={modal.app} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
