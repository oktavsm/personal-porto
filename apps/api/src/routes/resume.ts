import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { pickString } from "../lib/strings.js";

type ResumeBody = {
  label?: string;
  mediaAssetId?: string;
  notes?: string;
};

const includeMedia = { mediaAsset: true };

export async function resumeRoutes(app: FastifyInstance) {
  app.get("/api/public/resume", async () => ({
    data: await prisma.resumeVersion.findFirst({
      where: { isActive: true, mediaAssetId: { not: null } },
      include: includeMedia,
      orderBy: { uploadedAt: "desc" },
    }),
  }));

  app.get("/api/admin/resume", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.resumeVersion.findMany({
      where: { mediaAssetId: { not: null } },
      include: includeMedia,
      orderBy: { uploadedAt: "desc" },
    }),
  }));

  app.post<{ Body: ResumeBody }>("/api/admin/resume", { preHandler: app.requireAdmin }, async (request, reply) => {
    const label = pickString(request.body.label);
    const mediaAssetId = pickString(request.body.mediaAssetId);

    if (!label || !mediaAssetId) {
      return reply.code(400).send({ message: "Label and mediaAssetId are required" });
    }

    const media = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
    if (!media) {
      return reply.code(400).send({ message: "Media asset not found" });
    }

    const resume = await prisma.resumeVersion.create({
      data: {
        label,
        mediaAssetId,
        notes: pickString(request.body.notes) || null,
      },
      include: includeMedia,
    });

    await writeAuditLog(request, {
      action: "create",
      entityType: "resume",
      entityId: resume.id,
      entityLabel: resume.label,
      metadata: { mediaAssetId: resume.mediaAssetId, isActive: resume.isActive },
    });

    return reply.code(201).send({ data: resume });
  });

  app.patch<{ Params: { id: string } }>("/api/admin/resume/:id/activate", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.resumeVersion.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Resume version not found" });

    const resume = await prisma.$transaction(async (tx) => {
      await tx.resumeVersion.updateMany({ data: { isActive: false } });
      return tx.resumeVersion.update({
        where: { id: request.params.id },
        data: { isActive: true },
        include: includeMedia,
      });
    });

    await writeAuditLog(request, {
      action: "activate",
      entityType: "resume",
      entityId: resume.id,
      entityLabel: resume.label,
      metadata: { mediaAssetId: resume.mediaAssetId },
    });

    return { data: resume };
  });
}
