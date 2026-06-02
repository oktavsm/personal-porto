import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastify, { type FastifyError } from "fastify";
import fastifyStatic from "@fastify/static";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "./config.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { certificationRoutes } from "./routes/certifications.js";
import { contactRoutes } from "./routes/contact.js";
import { experienceRoutes } from "./routes/experiences.js";
import { healthRoutes } from "./routes/health.js";
import { liveSystemRoutes } from "./routes/liveSystems.js";
import { mediaRoutes } from "./routes/media.js";
import { musicRoutes } from "./routes/music.js";
import { pageRoutes } from "./routes/pages.js";
import { projectRoutes } from "./routes/projects.js";
import { resumeRoutes } from "./routes/resume.js";
import "./types.js";

export async function buildApp() {
  await mkdir(config.uploadDir, { recursive: true });

  const app = fastify({
    logger: config.nodeEnv === "development",
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowed = config.corsOrigin.split(",").map((item) => item.trim()).filter(Boolean);
      callback(null, allowed.includes(origin));
    },
    credentials: true,
  });

  await app.register(cookie, { secret: config.cookieSecret });
  await app.register(multipart, {
    limits: {
      fileSize: config.maxUploadMb * 1024 * 1024,
      files: 1,
    },
  });
  await app.register(fastifyStatic, {
    root: resolve(config.uploadDir),
    prefix: "/uploads/",
    decorateReply: false,
  });
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(mediaRoutes);
  await app.register(resumeRoutes);
  await app.register(projectRoutes);
  await app.register(experienceRoutes);
  await app.register(certificationRoutes);
  await app.register(liveSystemRoutes);
  await app.register(contactRoutes);
  await app.register(musicRoutes);
  await app.register(pageRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ message: `Route not found: ${request.method} ${request.url}` });
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);
    reply.code(error.statusCode ?? 500).send({
      message: error.message || "Internal server error",
    });
  });

  return app;
}
