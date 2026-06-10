import { db } from "@/db";
import { applications } from "@/db/schema";
import { desc } from "drizzle-orm";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const apps = db
    .select()
    .from(applications)
    .orderBy(desc(applications.id))
    .all();
  return <Dashboard apps={apps} />;
}
