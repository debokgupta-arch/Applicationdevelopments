import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI): rely on the real environment.
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (see .env.example).");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  // auth.* belongs to Supabase (or the local shim); never manage it from here.
  schemaFilter: ["public"],
  // Supabase owns anon/authenticated/service_role; don't try to create them.
  entities: { roles: { provider: "supabase" } },
  strict: true,
  verbose: true,
});
