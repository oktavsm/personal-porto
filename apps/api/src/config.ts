import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(apiRoot, "../..");

loadEnv({ path: resolve(repoRoot, ".env") });

export const config = {
  nodeEnv: process.env.API_NODE_ENV ?? process.env.NODE_ENV ?? "development",
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  cookieSecret: process.env.COOKIE_SECRET ?? process.env.SESSION_SECRET ?? "dev-cookie-secret-change-me",
  sessionDays: Number(process.env.SESSION_DAYS ?? 7),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  publicUploadBaseUrl: process.env.PUBLIC_UPLOAD_BASE_URL ?? "/uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 25),
};
