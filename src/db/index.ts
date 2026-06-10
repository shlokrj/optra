import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// Reuse the connection across Next.js dev-server hot reloads.
const globalForDb = globalThis as unknown as {
  __optraSqlite?: Database.Database;
};

function createConnection(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(path.join(dataDir, "optra.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'saved',
      category TEXT NOT NULL DEFAULT 'SWE',
      season TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      portal_url TEXT NOT NULL DEFAULT '',
      date_applied TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      referral INTEGER NOT NULL DEFAULT 0,
      resume TEXT NOT NULL DEFAULT '',
      cover_letter TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return sqlite;
}

const sqlite = globalForDb.__optraSqlite ?? createConnection();
if (process.env.NODE_ENV !== "production") globalForDb.__optraSqlite = sqlite;

export const db = drizzle(sqlite, { schema });
