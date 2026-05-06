/**
 * מריץ פקודה עם cwd = mom-manager כדי ש-Next יטען .env.local מהמקום הנכון.
 * שימוש משורש המונורפו: node mom-manager/scripts/run-in-app-root.cjs <args...>
 * דוגמה: node ... next dev --port 3333
 */
const { spawnSync } = require("child_process");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
process.chdir(appRoot);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: run-in-app-root.cjs <command> [args...]");
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  shell: true,
  env: process.env,
  cwd: appRoot,
});

process.exit(result.status === null ? 1 : result.status);
