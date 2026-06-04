import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
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

async function saveMediaFile(part: MultipartFile) {
  if (!allowedMimeTypes.has(part.mimetype)) {
    throw new Error(`Unsupported file type: ${part.mimetype}`);
  }

  const filename = `${randomUUID()}${safeExtension(part.filename)}`;
  const storagePath = join(config.uploadDir, filename);
  let sizeBytes = 0;
  part.file.on("data", (chunk: Buffer) => {
    sizeBytes += chunk.length;
  });
  await pipeline(part.file, createWriteStream(storagePath));

  return prisma.mediaAsset.create({
    data: {
      filename,
      originalName: part.filename,
      mimeType: part.mimetype,
      sizeBytes,
      storagePath,
      publicUrl: `${config.publicUploadBaseUrl.replace(/\/$/, "")}/${filename}`,
    },
  });
}

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/api/admin/media", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
  }));

  app.post("/api/admin/media", { preHandler: app.requireAdmin }, async (request, reply) => {
    await mkdir(config.uploadDir, { recursive: true });

    const createdMedia = [];
    try {
      for await (const part of request.files()) {
        createdMedia.push(await saveMediaFile(part));
      }
    } catch (error) {
      await Promise.all(
        createdMedia.map(async (media) => {
          await prisma.mediaAsset.delete({ where: { id: media.id } }).catch(() => undefined);
          await unlink(media.storagePath).catch(() => undefined);
        }),
      );
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Failed to upload media." });
    }

    if (createdMedia.length === 0) {
      return reply.code(400).send({ message: "At least one file is required" });
    }

    return reply.code(201).send({ data: createdMedia });
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

  app.put<{ Params: { id: string }; Body: { altText?: string; caption?: string } }>(
    "/api/admin/media/:id",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const media = await prisma.mediaAsset.findUnique({ where: { id: request.params.id } });
      if (!media) {
        return reply.code(404).send({ message: "Media not found" });
      }

      const updatedMedia = await prisma.mediaAsset.update({
        where: { id: media.id },
        data: {
          altText: request.body.altText,
          caption: request.body.caption,
        },
      });

      return { data: updatedMedia };
    }
  );
}
