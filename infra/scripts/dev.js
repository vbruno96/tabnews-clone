const { spawn } = require("node:child_process");

let cleaned = false;

const dev = spawn("pnpm", ["dev:script"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  if (cleaned) return;

  cleaned = true;
  spawn("pnpm", ["postdev"], {
    stdio: "inherit",
    shell: true,
  });
}

dev.on("close", () => cleanup());

process.on("SIGINT", () => {
  dev.kill("SIGQUIT");
});

// process.on("SIGTERM", () => {
//   dev.kill("SIGTERM");
// });
