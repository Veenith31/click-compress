import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SEARCH_DIRS = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
];

export function resolveBinary(name: string): string | null {
  for (const dir of SEARCH_DIRS) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const result = spawnSync("bash", ["-lc", `command -v ${name}`], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${SEARCH_DIRS.join(":")}${path.delimiter}${pathEnv}`,
    },
  });

  if (result.status === 0) {
    const resolved = result.stdout.trim();
    if (resolved) return resolved;
  }

  return null;
}

export function requireBinary(name: string, installHint: string): string {
  const resolved = resolveBinary(name);
  if (!resolved) {
    throw new Error(`${name} not found. ${installHint}`);
  }
  return resolved;
}
