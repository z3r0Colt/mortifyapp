import { spawnSync } from "node:child_process";
import path from "node:path";
const binary = path.resolve(
  `node_modules/deno/${process.platform === "win32" ? "deno.exe" : "deno"}`,
);
const result = spawnSync(
  binary,
  [
    "check",
    "--node-modules-dir=none",
    "supabase/functions/push-message/index.ts",
    "supabase/functions/reminders/index.ts",
    "supabase/functions/delete-account/index.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, DENO_DIR: path.resolve(".deno-cache") },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
