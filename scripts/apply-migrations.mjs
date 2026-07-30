#!/usr/bin/env node
/**
 * Apply versioned SQL migrations under supabase/migrations/ in filename order.
 *
 * Usage:
 *   DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/projectsim_test \
 *     node scripts/apply-migrations.mjs
 *
 * Intended for local Postgres and CI. For hosted Supabase, prefer
 * `supabase db push` / linked project migrations once the CLI is configured.
 */
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Resolve `pg` from the infrastructure workspace package (not a root dependency).
const require = createRequire(
  path.join(root, "packages/infrastructure/package.json"),
);
const { Client } = require("pg");
const migrationsDir = path.join(root, "supabase", "migrations");
const connectionString =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_ADMIN_URL (or DATABASE_URL) is required to apply migrations.",
  );
  process.exit(1);
}

const files = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`No .sql migrations found in ${migrationsDir}`);
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  for (const filename of files) {
    const already = await client.query(
      "select 1 from schema_migrations where filename = $1",
      [filename],
    );
    if (already.rowCount > 0) {
      console.log(`skip  ${filename}`);
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    console.log(`apply ${filename}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (filename) values ($1)",
        [filename],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.log("migrations complete");
} finally {
  await client.end();
}
