// `npm run dev`: chạy cùng lúc Next.js (cổng 3000) và Worker dịch (cổng 8787).
import { spawn, spawnSync } from "node:child_process";

const procs = [
  { name: "next", color: 36, cmd: "npx next dev" },
  { name: "worker", color: 35, cmd: "npm run dev:worker --silent" },
];

let stopping = false;

const children = procs.map(({ name, color, cmd }) => {
  const child = spawn(cmd, { shell: true, stdio: ["inherit", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "1" } });
  const tag = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines) out.write(tag + line + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (stopping) return;
    if (name === "worker") {
      // Worker hỏng thì vẫn để Next chạy: các tab khác dùng bình thường, chỉ tab Dịch báo lỗi
      process.stderr.write(`${tag}Worker dịch đã dừng (mã ${code}). Tab Dịch sẽ không hoạt động cho tới khi chạy lại.\n`);
    } else {
      stopAll(code ?? 0);
    }
  });
  return child;
});

function kill(child) {
  if (child.exitCode !== null || !child.pid) return;
  // shell: true tạo tiến trình con lồng nhau; trên Windows phải diệt cả cây
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGTERM");
}

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach(kill);
  process.exit(code);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
