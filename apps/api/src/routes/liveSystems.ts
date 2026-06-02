import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString, slugify } from "../lib/strings.js";

type LiveSystemBody = {
  slug?: string;
  title?: string;
  description?: string;
  url?: string;
  embedUrl?: string;
  isEmbeddable?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

function liveSystemData(body: LiveSystemBody) {
  const title = pickString(body.title);
  return {
    slug: pickString(body.slug) || slugify(title),
    title,
    description: pickString(body.description),
    url: pickString(body.url),
    embedUrl: pickString(body.embedUrl) || null,
    isEmbeddable: pickBoolean(body.isEmbeddable, true),
    isPublished: pickBoolean(body.isPublished, true),
    sortOrder: pickNumber(body.sortOrder),
  };
}

export async function liveSystemRoutes(app: FastifyInstance) {
  app.get("/api/public/systems", async () => ({
    data: await prisma.liveSystem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  }));

  app.get("/api/admin/systems", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.liveSystem.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
  }));

  app.post<{ Body: LiveSystemBody }>("/api/admin/systems", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = liveSystemData(request.body);
    if (!data.slug || !data.title || !data.url) {
      return reply.code(400).send({ message: "Slug, title, and URL are required" });
    }

    const system = await prisma.liveSystem.create({ data });
    return reply.code(201).send({ data: system });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/systems/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "liveSystem", ids));
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: LiveSystemBody }>("/api/admin/systems/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.liveSystem.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "System not found" });
    const system = await prisma.liveSystem.update({ where: { id: request.params.id }, data: liveSystemData(request.body) });
    return { data: system };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/systems/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.liveSystem.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "System not found" });
    await prisma.liveSystem.delete({ where: { id: request.params.id } });
    return { ok: true };
  });
}
