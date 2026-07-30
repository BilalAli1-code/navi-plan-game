#!/usr/bin/env node
/**
 * BC-003 content validation CLI (loads Domain via tsx for extensionless ESM).
 *
 * Usage:
 *   pnpm content:validate --case northstar-connected-care --version 1.0.0
 *   pnpm content:validate --case harbor-logistics-recovery --version 1.0.0
 *   pnpm content:validate:catalog
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts/content-validate-runner.ts");
const result = spawnSync(
  path.join(root, "node_modules/.bin/tsx"),
  [runner, ...process.argv.slice(2)],
  { stdio: "inherit", cwd: root },
);
process.exit(result.status ?? 1);
