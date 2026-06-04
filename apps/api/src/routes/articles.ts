import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { pickBoolean, pickNumber, pickString, slugify } from "../lib/strings.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type ArticleBody = {
  slug?: string;
  title?: string;
  subtitle?: string;
  excerpt?: string;
  category?: string;
  status?: string;
  isFeatured?: boolean;
  coverAssetId?: string;
  seoTitle?: string;
  seoDescription?: string;
  authorName?: string;
  authorRole?: string;
  tags?: string[] | string;
  blocks?: BlockInput[];
};

type BlockInput = {
  id?: string;
  type?: string;
  contentJson?: unknown;
  sortOrder?: number;
};

const includeArticleRelations = {
  blocks: { orderBy: { sortOrder: "asc" as const } },
  tags: { orderBy: { sortOrder: "asc" as const } },
  coverAsset: true,
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof includeArticleRelations;
}>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateReadingTime(blocks: BlockInput[]): number {
  const text = blocks
    .map((b) => {
      const c = b.contentJson as Record<string, unknown> | null;
      if (!c) return "";
      return [c["text"], c["code"], ...(Array.isArray(c["items"]) ? c["items"] : [])].join(" ");
    })
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function serializeArticle(article: ArticleWithRelations, publicOnly = false) {
  if (publicOnly && article.status !== "published") return null;
  const publishedAt = article.publishedAt ?? (article.status === "published" ? article.updatedAt : null);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    category: article.category,
    status: article.status,
    isFeatured: article.isFeatured,
    coverAssetId: article.coverAssetId,
    coverImage: article.coverAsset?.publicUrl ?? null,
    coverAlt: article.coverAsset?.altText ?? null,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    language: article.language,
    author: {
      name: article.authorName,
      role: article.authorRole ?? null,
    },
    tags: article.tags.map((t) => t.label),
    blocks: article.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      contentJson: b.contentJson,
      sortOrder: b.sortOrder,
    })),
    readingTime: estimateReadingTime(article.blocks),
    publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function articleBaseData(body: ArticleBody) {
  const title = pickString(body.title);
  const rawSlug = pickString(body.slug) || slugify(title);
  return {
    slug: rawSlug,
    title,
    subtitle: pickString(body.subtitle) || null,
    excerpt: pickString(body.excerpt),
    category: pickString(body.category, "Reflection"),
    status: pickString(body.status, "draft"),
    isFeatured: pickBoolean(body.isFeatured),
    coverAssetId: pickString(body.coverAssetId) || null,
    seoTitle: pickString(body.seoTitle) || null,
    seoDescription: pickString(body.seoDescription) || null,
    authorName: pickString(body.authorName, "Oktavianus Samuel"),
    authorRole: pickString(body.authorRole) || null,
  };
}

function toTagArray(tags: string[] | string | undefined): string[] {
  if (!tags) return [];
  if (typeof tags === "string")
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return tags.filter(Boolean);
}

async function replaceArticleChildren(
  tx: Prisma.TransactionClient,
  articleId: string,
  body: ArticleBody,
) {
  const tags = toTagArray(body.tags);
  const blocks: BlockInput[] = Array.isArray(body.blocks) ? body.blocks : [];

  await tx.articleTag.deleteMany({ where: { articleId } });
  await tx.articleBlock.deleteMany({ where: { articleId } });

  if (tags.length > 0) {
    await tx.articleTag.createMany({
      data: tags.map((label, sortOrder) => ({ articleId, label, sortOrder })),
    });
  }

  if (blocks.length > 0) {
    await tx.articleBlock.createMany({
      data: blocks.map((b, index) => ({
        articleId,
        type: pickString(b.type, "paragraph"),
        contentJson: (b.contentJson as Prisma.InputJsonValue) ?? {},
        sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : index,
      })),
    });
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function articleRoutes(app: FastifyInstance) {
  // ── Public ──────────────────────────────────────────────────────────────────

  app.get<{
    Querystring: { category?: string; tag?: string; featured?: string; limit?: string };
  }>("/api/public/articles", async (request) => {
    const { category, tag, featured, limit } = request.query;
    const take = limit ? Math.min(Math.max(pickNumber(limit, 0), 1), 24) : undefined;

    const articles = await prisma.article.findMany({
      where: {
        status: "published",
        ...(category ? { category } : {}),
        ...(featured === "true" ? { isFeatured: true } : {}),
        ...(tag
          ? { tags: { some: { label: { equals: tag, mode: "insensitive" } } } }
          : {}),
      },
      include: includeArticleRelations,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      ...(take ? { take } : {}),
    });

    return { data: articles.map((a) => serializeArticle(a, true)).filter(Boolean) };
  });

  app.get<{ Params: { slug: string } }>(
    "/api/public/articles/:slug",
    async (request, reply) => {
      const article = await prisma.article.findFirst({
        where: { slug: request.params.slug, status: "published" },
        include: includeArticleRelations,
      });
      if (!article) return reply.code(404).send({ message: "Article not found" });
      return { data: serializeArticle(article, true) };
    },
  );

  // ── Admin ────────────────────────────────────────────────────────────────────

  app.get<{
    Querystring: { status?: string; category?: string };
  }>("/api/admin/articles", { preHandler: app.requireAdmin }, async (request) => {
    const { status, category } = request.query;

    const articles = await prisma.article.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      include: includeArticleRelations,
      orderBy: [{ updatedAt: "desc" }],
    });

    return { data: articles.map((a) => serializeArticle(a)) };
  });

  app.get<{ Params: { id: string } }>(
    "/api/admin/articles/:id",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const article = await prisma.article.findUnique({
        where: { id: request.params.id },
        include: includeArticleRelations,
      });
      if (!article) return reply.code(404).send({ message: "Article not found" });
      return { data: serializeArticle(article) };
    },
  );

  app.post<{ Body: ArticleBody }>(
    "/api/admin/articles",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const data = articleBaseData(request.body);
      if (!data.title || !data.excerpt || !data.category) {
        return reply.code(400).send({ message: "Title, excerpt, and category are required" });
      }

      const article = await prisma.$transaction(async (tx) => {
        const created = await tx.article.create({
          data: {
            ...data,
            publishedAt: data.status === "published" ? new Date() : null,
          },
        });
        await replaceArticleChildren(tx, created.id, request.body);
        return tx.article.findUniqueOrThrow({
          where: { id: created.id },
          include: includeArticleRelations,
        });
      });

      return reply.code(201).send({ data: serializeArticle(article) });
    },
  );

  app.patch<{ Params: { id: string }; Body: ArticleBody }>(
    "/api/admin/articles/:id",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const exists = await prisma.article.findUnique({ where: { id: request.params.id } });
      if (!exists) return reply.code(404).send({ message: "Article not found" });

      const data = articleBaseData(request.body);
      if (!data.title || !data.excerpt || !data.category) {
        return reply.code(400).send({ message: "Title, excerpt, and category are required" });
      }

      const article = await prisma.$transaction(async (tx) => {
        await tx.article.update({
          where: { id: request.params.id },
          data: {
            ...data,
            publishedAt: data.status === "published" && !exists.publishedAt ? new Date() : exists.publishedAt,
          },
        });
        await replaceArticleChildren(tx, request.params.id, request.body);
        return tx.article.findUniqueOrThrow({
          where: { id: request.params.id },
          include: includeArticleRelations,
        });
      });

      return { data: serializeArticle(article) };
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/admin/articles/:id",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const exists = await prisma.article.findUnique({ where: { id: request.params.id } });
      if (!exists) return reply.code(404).send({ message: "Article not found" });
      await prisma.article.delete({ where: { id: request.params.id } });
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/articles/:id/publish",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const exists = await prisma.article.findUnique({ where: { id: request.params.id } });
      if (!exists) return reply.code(404).send({ message: "Article not found" });

      const article = await prisma.article.update({
        where: { id: request.params.id },
        data: { status: "published", publishedAt: exists.publishedAt ?? new Date() },
        include: includeArticleRelations,
      });
      return { data: serializeArticle(article) };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/articles/:id/unpublish",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const exists = await prisma.article.findUnique({ where: { id: request.params.id } });
      if (!exists) return reply.code(404).send({ message: "Article not found" });

      const article = await prisma.article.update({
        where: { id: request.params.id },
        data: { status: "draft" },
        include: includeArticleRelations,
      });
      return { data: serializeArticle(article) };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/articles/:id/duplicate",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const source = await prisma.article.findUnique({
        where: { id: request.params.id },
        include: includeArticleRelations,
      });
      if (!source) return reply.code(404).send({ message: "Article not found" });

      const baseSlug = `${source.slug}-copy`;
      let newSlug = baseSlug;
      let attempt = 0;
      while (await prisma.article.findUnique({ where: { slug: newSlug } })) {
        attempt++;
        newSlug = `${baseSlug}-${attempt}`;
      }

      const article = await prisma.$transaction(async (tx) => {
        const created = await tx.article.create({
          data: {
            slug: newSlug,
            title: `${source.title} (Copy)`,
            subtitle: source.subtitle,
            excerpt: source.excerpt,
            category: source.category,
            status: "draft",
            isFeatured: false,
            coverAssetId: source.coverAssetId,
            seoTitle: source.seoTitle,
            seoDescription: source.seoDescription,
            authorName: source.authorName,
            authorRole: source.authorRole,
          },
        });

        if (source.tags.length > 0) {
          await tx.articleTag.createMany({
            data: source.tags.map((t) => ({ articleId: created.id, label: t.label, sortOrder: t.sortOrder })),
          });
        }

        if (source.blocks.length > 0) {
          await tx.articleBlock.createMany({
            data: source.blocks.map((b) => ({
              articleId: created.id,
              type: b.type,
              contentJson: b.contentJson as Prisma.InputJsonValue,
              sortOrder: b.sortOrder,
            })),
          });
        }

        return tx.article.findUniqueOrThrow({
          where: { id: created.id },
          include: includeArticleRelations,
        });
      });

      return reply.code(201).send({ data: serializeArticle(article) });
    },
  );
}
