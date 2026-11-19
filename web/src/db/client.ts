import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as {
  __homeshiftDb?: Database;
  __homeshiftSql?: postgres.Sql;
};

/**
 * Privileged connection (bypasses RLS). Use it only for identity lookups and
 * scripts; app data access goes through {@link withUser}.
 */
export function adminDb(): Database {
  if (!globalForDb.__homeshiftDb) {
    // prepare: false keeps this compatible with Supabase's transaction pooler.
    const client = postgres(serverEnv().DATABASE_URL, {
      prepare: false,
      max: 10,
      onnotice: () => undefined,
    });
    globalForDb.__homeshiftSql = client;
    globalForDb.__homeshiftDb = drizzle(client, { schema });
  }
  return globalForDb.__homeshiftDb;
}

/** Closes the pool (scripts and tests; the app keeps it open). */
export async function closeDb(): Promise<void> {
  await globalForDb.__homeshiftSql?.end();
  globalForDb.__homeshiftSql = undefined;
  globalForDb.__homeshiftDb = undefined;
}

/**
 * Runs `fn` in a transaction as the Supabase `authenticated` role with the
 * user's id as the JWT subject, so every row-level security policy applies
 * exactly as it would for a request through Supabase.
 */
export async function withUser<T>(userId: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  return adminDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}
