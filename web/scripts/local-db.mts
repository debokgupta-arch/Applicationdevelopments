/**
 * Local Postgres helper for development (no Docker needed).
 *
 *   pnpm db:init       create the data folder (once)
 *   pnpm db:start      start Postgres on localhost:54322
 *   pnpm db:stop       stop it
 *   pnpm db:status     show whether it is running
 *   pnpm db:bootstrap  install the local Supabase look-alike objects (once, after init)
 *
 * Binary and data locations default to D:/dev and can be overridden with
 * LOCAL_PG_BIN and LOCAL_PG_DATA. Credentials match Supabase's local defaults.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import postgres from "postgres";

const PG_BIN = process.env.LOCAL_PG_BIN ?? "D:/dev/pgsql/bin";
const PG_DATA = process.env.LOCAL_PG_DATA ?? "D:/dev/pgsql-data";
const PORT = 54322;
const SUPERUSER = "postgres";
const PASSWORD = "postgres";

const bin = (name: string) =>
  path.join(PG_BIN, process.platform === "win32" ? `${name}.exe` : name);

function run(name: string, args: string[], stdio: "inherit" | "ignore" = "inherit"): void {
  execFileSync(bin(name), args, { stdio });
}

function init(): void {
  if (existsSync(path.join(PG_DATA, "PG_VERSION"))) {
    console.log(`Data folder already initialised: ${PG_DATA}`);
    return;
  }
  const dir = mkdtempSync(path.join(tmpdir(), "hs-pg-"));
  const pwfile = path.join(dir, "pw.txt");
  writeFileSync(pwfile, PASSWORD);
  try {
    run("initdb", [
      "-D",
      PG_DATA,
      "-U",
      SUPERUSER,
      "--pwfile",
      pwfile,
      "-A",
      "scram-sha-256",
      "-E",
      "UTF8",
      "--locale=C",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function start(): void {
  const log = path.join(PG_DATA, "server.log");
  // The server outlives this script; inheriting our stdio would keep the
  // terminal's pipe open forever, so output goes to the log file only.
  run(
    "pg_ctl",
    ["-D", PG_DATA, "-l", log, "-o", `-p ${PORT} -c listen_addresses=localhost`, "-w", "start"],
    "ignore",
  );
  console.log(`Postgres running on localhost:${PORT} (log: ${log})`);
}

function stop(): void {
  run("pg_ctl", ["-D", PG_DATA, "-m", "fast", "stop"]);
}

function status(): void {
  try {
    run("pg_ctl", ["-D", PG_DATA, "status"]);
  } catch {
    process.exitCode = 1;
  }
}

async function bootstrap(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example).");
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`Refusing to run the local Supabase shim against non-local host "${host}".`);
  }
  const sqlText = readFileSync(
    path.join(import.meta.dirname, "sql", "local-supabase-shim.sql"),
    "utf8",
  );
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await sql.unsafe(sqlText);
    console.log("Local Supabase shim installed.");
  } finally {
    await sql.end();
  }
}

const commands: Record<string, () => void | Promise<void>> = {
  init,
  start,
  stop,
  status,
  bootstrap,
};
const command = process.argv[2] ?? "";
const handler = commands[command];
if (!handler) {
  console.error(`Usage: local-db.mts <${Object.keys(commands).join("|")}>`);
  process.exit(1);
}
await handler();
