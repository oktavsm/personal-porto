import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString, slugify, toStringArray } from "../lib/strings.js";

type ExperienceBody = {
  slug?: string;
  title?: string;
  organization?: string;
  period?: string;
  category?: string;
  summary?: string;
  reflection?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  responsibilities?: string[] | string;
  impact?: string[] | string;
  values?: string[] | string;
  coverMediaAssetId?: string;
  galleryMediaAssetIds?: string[] | string;
};

const includeExperienceRelations = {
  responsibilities: { orderBy: { sortOrder: "asc" as const } },
  impacts: { orderBy: { sortOrder: "asc" as const } },
  values: { orderBy: { sortOrder: "asc" as const } },
  media: {
    orderBy: { sortOrder: "asc" as const },
    include: { mediaAsset: true },
  },
};

type ExperienceWithRelations = Prisma.ExperienceGetPayload<{ include: typeof includeExperienceRelations }>;

function experienceBaseData(body: ExperienceBody) {
  const title = pickString(body.title);
  return {
    slug: pickString(body.slug) || slugify(title),
    title,
    organization: pickString(body.organization),
    period: pickString(body.period),
    category: pickString(body.category, "Community"),
    summary: pickString(body.summary),
    reflection: pickString(body.reflection),
    isFeatured: pickBoolean(body.isFeatured),
    isPublished: pickBoolean(body.isPublished, true),
    sortOrder: pickNumber(body.sortOrder),
  };
}

function serializeExperience(experience: ExperienceWithRelations) {
  const mediaAssets = experience.media.map((item) => ({
    id: item.mediaAsset.id,
    kind: item.kind,
    publicUrl: item.mediaAsset.publicUrl,
    originalName: item.mediaAsset.originalName,
    sortOrder: item.sortOrder,
  }));

  return {
    ...experience,
    responsibilities: experience.responsibilities.map((item) => item.text),
    impact: experience.impacts.map((item) => item.text),
    values: experience.values.map((item) => item.label),
    images: mediaAssets.map((item) => item.publicUrl),
    mediaAssets,
  };
}

async function replaceExperienceChildren(tx: Prisma.TransactionClient, experienceId: string, body: ExperienceBody) {
  const responsibilities = toStringArray(body.responsibilities);
  const impact = toStringArray(body.impact);
  const values = toStringArray(body.values);
  const coverMediaAssetId = pickString(body.coverMediaAssetId);
  const galleryMediaAssetIds = toStringArray(body.galleryMediaAssetIds).filter((id) => id !== coverMediaAssetId);

  await tx.experienceResponsibility.deleteMany({ where: { experienceId } });
  await tx.experienceImpact.deleteMany({ where: { experienceId } });
  await tx.experienceValue.deleteMany({ where: { experienceId } });
  await tx.experienceMedia.deleteMany({ where: { experienceId } });

  await Promise.all([
    responsibilities.length > 0
      ? tx.experienceResponsibility.createMany({ data: responsibilities.map((text, sortOrder) => ({ experienceId, text, sortOrder })) })
      : Promise.resolve(),
    impact.length > 0 ? tx.experienceImpact.createMany({ data: impact.map((text, sortOrder) => ({ experienceId, text, sortOrder })) }) : Promise.resolve(),
    values.length > 0 ? tx.experienceValue.createMany({ data: values.map((label, sortOrder) => ({ experienceId, label, sortOrder })) }) : Promise.resolve(),
    coverMediaAssetId || galleryMediaAssetIds.length > 0
      ? tx.experienceMedia.createMany({
          data: [
            coverMediaAssetId ? { experienceId, mediaAssetId: coverMediaAssetId, kind: "cover", sortOrder: 0 } : null,
            ...galleryMediaAssetIds.map((mediaAssetId, index) => ({ experienceId, mediaAssetId, kind: "gallery", sortOrder: index + 1 })),
          ].filter((item): item is { experienceId: string; mediaAssetId: string; kind: string; sortOrder: number } => Boolean(item)),
        })
      : Promise.resolve(),
  ]);
}

export async function experienceRoutes(app: FastifyInstance) {
  app.get("/api/public/experiences", async () => {
    const data = await prisma.experience.findMany({
      where: { isPublished: true },
      include: includeExperienceRelations,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return { data: data.map(serializeExperience) };
  });

  app.get<{ Params: { slug: string } }>("/api/public/experiences/:slug", async (request, reply) => {
    const experience = await prisma.experience.findFirst({
      where: { slug: request.params.slug, isPublished: true },
      include: includeExperienceRelations,
    });
    if (!experience) return reply.code(404).send({ message: "Experience not found" });
    return { data: serializeExperience(experience) };
  });

  app.get("/api/admin/experiences", { preHandler: app.requireAdmin }, async () => {
    const data = await prisma.experience.findMany({
      include: includeExperienceRelations,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return { data: data.map(serializeExperience) };
  });

  app.post<{ Body: ExperienceBody }>("/api/admin/experiences", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = experienceBaseData(request.body);
    if (!data.slug || !data.title || !data.organization || !data.period || !data.category || !data.summary || !data.reflection) {
      return reply.code(400).send({ message: "Title, organization, period, category, summary, and reflection are required" });
    }

    const experience = await prisma.$transaction(async (tx) => {
      const created = await tx.experience.create({ data });
      await replaceExperienceChildren(tx, created.id, request.body);
      return tx.experience.findUniqueOrThrow({ where: { id: created.id }, include: includeExperienceRelations });
    });

    await writeAuditLog(request, {
      action: "create",
      entityType: "experience",
      entityId: experience.id,
      entityLabel: experience.title,
      metadata: { category: experience.category, period: experience.period },
    });

    return reply.code(201).send({ data: serializeExperience(experience) });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/experiences/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "experience", ids));
    await writeAuditLog(request, {
      action: "reorder",
      entityType: "experience",
      metadata: { count: ids.length },
    });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: ExperienceBody }>("/api/admin/experiences/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.experience.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Experience not found" });

    const data = experienceBaseData(request.body);
    if (!data.slug || !data.title || !data.organization || !data.period || !data.category || !data.summary || !data.reflection) {
      return reply.code(400).send({ message: "Title, organization, period, category, summary, and reflection are required" });
    }

    const experience = await prisma.$transaction(async (tx) => {
      await tx.experience.update({ where: { id: request.params.id }, data });
      await replaceExperienceChildren(tx, request.params.id, request.body);
      return tx.experience.findUniqueOrThrow({ where: { id: request.params.id }, include: includeExperienceRelations });
    });

    await writeAuditLog(request, {
      action: "update",
      entityType: "experience",
      entityId: experience.id,
      entityLabel: experience.title,
      metadata: { previousTitle: exists.title, category: experience.category, period: experience.period },
    });

    return { data: serializeExperience(experience) };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/experiences/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.experience.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Experience not found" });
    await prisma.experience.delete({ where: { id: request.params.id } });
    await writeAuditLog(request, {
      action: "delete",
      entityType: "experience",
      entityId: exists.id,
      entityLabel: exists.title,
      metadata: { category: exists.category, period: exists.period },
    });
    return { ok: true };
  });
}
