import net from "node:net";

const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 30000);
const intervalMs = 750;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to wait for database.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = Number(url.port || 5432);
const startedAt = Date.now();

function attempt() {
  const socket = net.createConnection({ host, port });

  socket.once("connect", () => {
    socket.end();
    console.log(`Database is reachable at ${host}:${port}`);
  });

  socket.once("error", () => {
    socket.destroy();
    if (Date.now() - startedAt >= timeoutMs) {
      console.error(`Database is not reachable at ${host}:${port} after ${timeoutMs}ms`);
      process.exit(1);
    }

    setTimeout(attempt, intervalMs);
  });
}

attempt();
