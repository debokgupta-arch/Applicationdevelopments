import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Make .env.local (e.g. DATABASE_URL) visible to tests, like Next.js does for the app.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI): database tests skip themselves.
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
