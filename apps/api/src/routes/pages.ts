import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { pickBoolean, pickNumber, pickString } from "../lib/strings.js";

const includePageRelations = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
};

type SitePageWithRelations = Prisma.SitePageGetPayload<{ include: typeof includePageRelations }>;

type PageBody = {
  title?: string;
  description?: string;
};

type SectionBody = {
  key?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  settingsJson?: Prisma.InputJsonValue;
  sortOrder?: number;
  isPublished?: boolean;
};

type BlockBody = {
  type?: string;
  contentJson?: Prisma.InputJsonValue;
  sortOrder?: number;
  isPublished?: boolean;
};

type ReorderBody = {
  ids?: string[];
};

function serializePage(page: SitePageWithRelations, publicOnly = false) {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    sections: page.sections
      .filter((section) => !publicOnly || section.isPublished)
      .map((section) => ({
        id: section.id,
        key: section.key,
        title: section.title,
        subtitle: section.subtitle,
        body: section.body,
        settingsJson: section.settingsJson,
        sortOrder: section.sortOrder,
        isPublished: section.isPublished,
        blocks: section.blocks
          .filter((block) => !publicOnly || block.isPublished)
          .map((block) => ({
            id: block.id,
            type: block.type,
            contentJson: block.contentJson,
            sortOrder: block.sortOrder,
            isPublished: block.isPublished,
          })),
      })),
  };
}

function pageData(body: PageBody) {
  return {
    title: pickString(body.title),
    description: pickString(body.description) || null,
  };
}

function sectionData(body: SectionBody) {
  return {
    title: pickString(body.title) || null,
    subtitle: pickString(body.subtitle) || null,
    body: pickString(body.body) || null,
    settingsJson: body.settingsJson ?? Prisma.JsonNull,
    sortOrder: pickNumber(body.sortOrder),
    isPublished: pickBoolean(body.isPublished, true),
  };
}

function blockData(body: BlockBody) {
  return {
    type: pickString(body.type, "card"),
    contentJson: body.contentJson ?? {},
    sortOrder: pickNumber(body.sortOrder),
    isPublished: pickBoolean(body.isPublished, true),
  };
}

async function findSection(pageSlug: string, sectionKey: string) {
  const page = await prisma.sitePage.findUnique({ where: { slug: pageSlug } });
  if (!page) return null;
  return prisma.siteSection.findUnique({
    where: { pageId_key: { pageId: page.id, key: sectionKey } },
  });
}

export async function pageRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>("/api/public/pages/:slug", async (request, reply) => {
    const page = await prisma.sitePage.findUnique({
      where: { slug: request.params.slug },
      include: includePageRelations,
    });
    if (!page) return reply.code(404).send({ message: "Page not found" });
    return { data: serializePage(page, true) };
  });

  app.get("/api/admin/pages", { preHandler: app.requireAdmin }, async () => {
    const pages = await prisma.sitePage.findMany({
      include: includePageRelations,
      orderBy: { updatedAt: "desc" },
    });
    return { data: pages.map((page) => serializePage(page)) };
  });

  app.get<{ Params: { slug: string } }>("/api/admin/pages/:slug", { preHandler: app.requireAdmin }, async (request, reply) => {
    const page = await prisma.sitePage.findUnique({
      where: { slug: request.params.slug },
      include: includePageRelations,
    });
    if (!page) return reply.code(404).send({ message: "Page not found" });
    return { data: serializePage(page) };
  });

  app.patch<{ Params: { slug: string }; Body: PageBody }>("/api/admin/pages/:slug", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = pageData(request.body);
    if (!data.title) return reply.code(400).send({ message: "Title is required" });

    const page = await prisma.sitePage.update({
      where: { slug: request.params.slug },
      data,
      include: includePageRelations,
    });
    return { data: serializePage(page) };
  });

  app.patch<{ Params: { slug: string; key: string }; Body: SectionBody }>("/api/admin/pages/:slug/sections/:key", { preHandler: app.requireAdmin }, async (request, reply) => {
    const page = await prisma.sitePage.findUnique({ where: { slug: request.params.slug } });
    if (!page) return reply.code(404).send({ message: "Page not found" });

    const section = await prisma.siteSection.upsert({
      where: { pageId_key: { pageId: page.id, key: request.params.key } },
      update: sectionData(request.body),
      create: {
        pageId: page.id,
        key: pickString(request.body.key) || request.params.key,
        ...sectionData(request.body),
      },
    });

    return { data: section };
  });

  app.post<{ Params: { slug: string; key: string }; Body: BlockBody }>("/api/admin/pages/:slug/sections/:key/blocks", { preHandler: app.requireAdmin }, async (request, reply) => {
    const section = await findSection(request.params.slug, request.params.key);
    if (!section) return reply.code(404).send({ message: "Section not found" });

    const block = await prisma.contentBlock.create({
      data: {
        sectionId: section.id,
        ...blockData(request.body),
      },
    });
    return reply.code(201).send({ data: block });
  });

  app.patch<{ Params: { slug: string; key: string; blockId: string }; Body: BlockBody }>(
    "/api/admin/pages/:slug/sections/:key/blocks/:blockId",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const section = await findSection(request.params.slug, request.params.key);
      if (!section) return reply.code(404).send({ message: "Section not found" });

      const exists = await prisma.contentBlock.findFirst({
        where: { id: request.params.blockId, sectionId: section.id },
      });
      if (!exists) return reply.code(404).send({ message: "Block not found" });

      const block = await prisma.contentBlock.update({
        where: { id: request.params.blockId },
        data: blockData(request.body),
      });
      return { data: block };
    },
  );

  app.delete<{ Params: { slug: string; key: string; blockId: string } }>("/api/admin/pages/:slug/sections/:key/blocks/:blockId", { preHandler: app.requireAdmin }, async (request, reply) => {
    const section = await findSection(request.params.slug, request.params.key);
    if (!section) return reply.code(404).send({ message: "Section not found" });

    const exists = await prisma.contentBlock.findFirst({
      where: { id: request.params.blockId, sectionId: section.id },
    });
    if (!exists) return reply.code(404).send({ message: "Block not found" });

    await prisma.contentBlock.delete({ where: { id: request.params.blockId } });
    return { ok: true };
  });

  app.post<{ Params: { slug: string; key: string }; Body: ReorderBody }>("/api/admin/pages/:slug/sections/:key/blocks/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const section = await findSection(request.params.slug, request.params.key);
    if (!section) return reply.code(404).send({ message: "Section not found" });

    const ids = Array.isArray(request.body.ids) ? request.body.ids.map(String).filter(Boolean) : [];
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });

    const blockCount = await prisma.contentBlock.count({
      where: {
        sectionId: section.id,
        id: { in: ids },
      },
    });
    if (blockCount !== ids.length) return reply.code(400).send({ message: "All block ids must belong to the selected section" });

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.contentBlock.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
    return { ok: true };
  });
}
