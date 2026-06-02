import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString, slugify, toStringArray } from "../lib/strings.js";

type ProjectBody = {
  slug?: string;
  title?: string;
  ecosystem?: string;
  category?: string;
  priority?: string;
  summary?: string;
  problem?: string;
  solution?: string;
  status?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  roles?: string[] | string;
  techStack?: string[] | string;
  learnings?: string[] | string;
  demoUrl?: string;
  githubUrl?: string;
  downloadUrl?: string;
  coverMediaAssetId?: string;
  galleryMediaAssetIds?: string[] | string;
};

const includeProjectRelations = {
  roles: { orderBy: { sortOrder: "asc" as const } },
  techStack: { orderBy: { sortOrder: "asc" as const } },
  learnings: { orderBy: { sortOrder: "asc" as const } },
  links: { orderBy: { sortOrder: "asc" as const } },
  media: {
    orderBy: { sortOrder: "asc" as const },
    include: { mediaAsset: true },
  },
};

type ProjectWithRelations = Prisma.ProjectGetPayload<{ include: typeof includeProjectRelations }>;

function projectBaseData(body: ProjectBody) {
  const title = pickString(body.title);
  return {
    slug: pickString(body.slug) || slugify(title),
    title,
    ecosystem: pickString(body.ecosystem) || null,
    category: pickString(body.category),
    priority: pickString(body.priority, "Featured"),
    summary: pickString(body.summary),
    problem: pickString(body.problem),
    solution: pickString(body.solution),
    status: pickString(body.status, "In Development"),
    isFeatured: pickBoolean(body.isFeatured),
    isPublished: pickBoolean(body.isPublished, true),
    sortOrder: pickNumber(body.sortOrder),
  };
}

function linkData(body: ProjectBody) {
  return [
    { type: "demo", label: "Live Demo", url: pickString(body.demoUrl), sortOrder: 0 },
    { type: "github", label: "Source Code", url: pickString(body.githubUrl), sortOrder: 1 },
    { type: "download", label: "Download", url: pickString(body.downloadUrl), sortOrder: 2 },
  ].filter((link) => link.url);
}

function serializeProject(project: ProjectWithRelations) {
  const mediaAssets = project.media.map((item) => ({
    id: item.mediaAsset.id,
    kind: item.kind,
    publicUrl: item.mediaAsset.publicUrl,
    originalName: item.mediaAsset.originalName,
    sortOrder: item.sortOrder,
  }));

  return {
    ...project,
    roles: project.roles.map((role) => role.label),
    techStack: project.techStack.map((tech) => tech.label),
    learnings: project.learnings.map((learning) => learning.text),
    links: project.links.reduce<Record<string, string>>((links, link) => {
      links[link.type] = link.url;
      return links;
    }, {}),
    images: mediaAssets.map((item) => item.publicUrl),
    mediaAssets,
  };
}

async function replaceProjectChildren(tx: Prisma.TransactionClient, projectId: string, body: ProjectBody) {
  const roles = toStringArray(body.roles);
  const techStack = toStringArray(body.techStack);
  const learnings = toStringArray(body.learnings);
  const links = linkData(body);
  const coverMediaAssetId = pickString(body.coverMediaAssetId);
  const galleryMediaAssetIds = toStringArray(body.galleryMediaAssetIds).filter((id) => id !== coverMediaAssetId);

  await tx.projectRole.deleteMany({ where: { projectId } });
  await tx.projectTechStack.deleteMany({ where: { projectId } });
  await tx.projectLearning.deleteMany({ where: { projectId } });
  await tx.projectLink.deleteMany({ where: { projectId } });
  await tx.projectMedia.deleteMany({ where: { projectId } });

  await Promise.all([
    roles.length > 0
      ? tx.projectRole.createMany({ data: roles.map((label, sortOrder) => ({ projectId, label, sortOrder })) })
      : Promise.resolve(),
    techStack.length > 0
      ? tx.projectTechStack.createMany({ data: techStack.map((label, sortOrder) => ({ projectId, label, sortOrder })) })
      : Promise.resolve(),
    learnings.length > 0
      ? tx.projectLearning.createMany({ data: learnings.map((text, sortOrder) => ({ projectId, text, sortOrder })) })
      : Promise.resolve(),
    links.length > 0
      ? tx.projectLink.createMany({ data: links.map((link) => ({ projectId, ...link })) })
      : Promise.resolve(),
    coverMediaAssetId || galleryMediaAssetIds.length > 0
      ? tx.projectMedia.createMany({
          data: [
            coverMediaAssetId ? { projectId, mediaAssetId: coverMediaAssetId, kind: "cover", sortOrder: 0 } : null,
            ...galleryMediaAssetIds.map((mediaAssetId, index) => ({ projectId, mediaAssetId, kind: "gallery", sortOrder: index + 1 })),
          ].filter((item): item is { projectId: string; mediaAssetId: string; kind: string; sortOrder: number } => Boolean(item)),
        })
      : Promise.resolve(),
  ]);
}

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/public/projects", async () => {
    const data = await prisma.project.findMany({
      where: { isPublished: true },
      include: includeProjectRelations,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return { data: data.map(serializeProject) };
  });

  app.get<{ Params: { slug: string } }>("/api/public/projects/:slug", async (request, reply) => {
    const project = await prisma.project.findFirst({
      where: { slug: request.params.slug, isPublished: true },
      include: includeProjectRelations,
    });
    if (!project) return reply.code(404).send({ message: "Project not found" });
    return { data: serializeProject(project) };
  });

  app.get("/api/admin/projects", { preHandler: app.requireAdmin }, async () => {
    const data = await prisma.project.findMany({
      include: includeProjectRelations,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return { data: data.map(serializeProject) };
  });

  app.post<{ Body: ProjectBody }>("/api/admin/projects", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = projectBaseData(request.body);
    if (!data.slug || !data.title || !data.category || !data.summary || !data.problem || !data.solution) {
      return reply.code(400).send({ message: "Title, category, summary, problem, and solution are required" });
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({ data });
      await replaceProjectChildren(tx, created.id, request.body);
      return tx.project.findUniqueOrThrow({ where: { id: created.id }, include: includeProjectRelations });
    });

    return reply.code(201).send({ data: serializeProject(project) });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/projects/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "project", ids));
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: ProjectBody }>("/api/admin/projects/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.project.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Project not found" });

    const data = projectBaseData(request.body);
    if (!data.slug || !data.title || !data.category || !data.summary || !data.problem || !data.solution) {
      return reply.code(400).send({ message: "Title, category, summary, problem, and solution are required" });
    }

    const project = await prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id: request.params.id }, data });
      await replaceProjectChildren(tx, request.params.id, request.body);
      return tx.project.findUniqueOrThrow({ where: { id: request.params.id }, include: includeProjectRelations });
    });

    return { data: serializeProject(project) };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/projects/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.project.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Project not found" });
    await prisma.project.delete({ where: { id: request.params.id } });
    return { ok: true };
  });
}
