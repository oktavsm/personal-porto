import type { FastifyInstance } from "fastify";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "audio/mpeg",
  "audio/mp3",
  "video/mp4",
]);

function safeExtension(filename: string) {
  const extension = extname(filename).toLowerCase();
  return extension.replace(/[^a-z0-9.]/g, "") || "";
}

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/api/admin/media", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
  }));

  app.post("/api/admin/media", { preHandler: app.requireAdmin }, async (request, reply) => {
    const part = await request.file();
    if (!part) {
      return reply.code(400).send({ message: "File is required" });
    }

    if (!allowedMimeTypes.has(part.mimetype)) {
      return reply.code(400).send({ message: `Unsupported file type: ${part.mimetype}` });
    }

    await mkdir(config.uploadDir, { recursive: true });

    const filename = `${randomUUID()}${safeExtension(part.filename)}`;
    const storagePath = join(config.uploadDir, filename);
    let sizeBytes = 0;
    part.file.on("data", (chunk: Buffer) => {
      sizeBytes += chunk.length;
    });
    await pipeline(part.file, createWriteStream(storagePath));

    const media = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: part.filename,
        mimeType: part.mimetype,
        sizeBytes,
        storagePath,
        publicUrl: `${config.publicUploadBaseUrl.replace(/\/$/, "")}/${filename}`,
      },
    });

    return reply.code(201).send({ data: media });
  });

  app.delete<{ Params: { id: string } }>("/api/admin/media/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const media = await prisma.mediaAsset.findUnique({ where: { id: request.params.id } });
    if (!media) {
      return reply.code(404).send({ message: "Media not found" });
    }

    await prisma.mediaAsset.delete({ where: { id: media.id } });
    await unlink(media.storagePath).catch(() => undefined);

    return { ok: true };
  });
}
