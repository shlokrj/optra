"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importApplications } from "@/lib/actions";
import {
  IMPORT_FIELDS,
  buildApplications,
  findHeaderRow,
  guessFieldForHeader,
  parseCSV,
  type ImportFieldKey,
} from "@/lib/importing";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/lib/constants";

type Parsed = {
  fileName: string;
  headers: string[];
  dataRows: string[][];
};

export default function ImportClient() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Record<number, ImportFieldKey>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const loadText = (text: string, fileName: string) => {
    setError("");
    setDone(null);
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setError("Couldn't find any data rows in that file.");
      return;
    }
    const headerIdx = findHeaderRow(rows);
    const headers = rows[headerIdx].map((h) => h.trim());
    const dataRows = rows.slice(headerIdx + 1);
    const auto: Record<number, ImportFieldKey> = {};
    headers.forEach((h, i) => {
      auto[i] = guessFieldForHeader(h);
    });
    setParsed({ fileName, headers, dataRows });
    setMapping(auto);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then((text) => loadText(text, file.name));
  };

  const preview = useMemo(
    () => (parsed ? buildApplications(parsed.dataRows, mapping) : []),
    [parsed, mapping],
  );

  const runImport = () => {
    startTransition(async () => {
      const result = await importApplications(preview);
      if (result.ok) {
        setDone(result.count);
        setTimeout(() => router.push("/"), 900);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Import from CSV</h1>
        <p className="mt-1 text-sm text-zinc-500">
          In Google Sheets: <span className="text-zinc-400">File → Download →
          Comma Separated Values (.csv)</span>, then drop the file here. Extra
          rows above your header (titles, counters) are detected and skipped
          automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInput.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 py-12 text-center transition-colors hover:border-indigo-500/60 hover:bg-zinc-900/70"
      >
        <p className="text-sm font-medium text-zinc-300">
          {parsed ? parsed.fileName : "Drop a .csv file here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {parsed
            ? `${parsed.dataRows.length} rows found — pick another file to start over`
            : "Your file never leaves this machine"}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
        />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {parsed && (
        <>
          {/* Column mapping */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">
              Column mapping
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Auto-detected from your headers — adjust anything that looks off.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {parsed.headers.map((header, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
                >
                  <span
                    className="truncate text-xs text-zinc-400"
                    title={header}
                  >
                    {header || `(column ${i + 1})`}
                  </span>
                  <select
                    value={mapping[i] ?? "skip"}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [i]: e.target.value as ImportFieldKey,
                      }))
                    }
                    className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-xs text-zinc-200 focus:outline-none"
                  >
                    {IMPORT_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-200">
                Preview — {preview.length} applications
              </h2>
              <button
                onClick={runImport}
                disabled={pending || preview.length === 0 || done !== null}
                className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {done !== null
                  ? `Imported ${done} ✓`
                  : pending
                    ? "Importing…"
                    : `Import ${preview.length} applications`}
              </button>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900 text-left text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Company</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Season</th>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2 font-medium">Applied</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-zinc-800/60 text-zinc-300"
                    >
                      <td className="px-4 py-2 font-medium text-zinc-100">
                        {row.company}
                      </td>
                      <td className="px-4 py-2">{row.role}</td>
                      <td className="px-4 py-2 text-zinc-400">
                        {row.season || "—"}
                      </td>
                      <td className="px-4 py-2 text-zinc-400">
                        {row.category}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-zinc-400">
                        {formatDate(row.dateApplied)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={row.status as Status} />
                      </td>
                    </tr>
                  ))}
                  {preview.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-zinc-500"
                      >
                        No importable rows — make sure a column is mapped to
                        Company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
