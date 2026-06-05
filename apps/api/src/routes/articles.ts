import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { pickBoolean, pickNumber, pickString, slugify } from "../lib/strings.js";
import { articleWritingContextMarkdown } from "./portfolioContext.js";

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

type ArticleGenerateDraftBody = {
  topic?: string;
  rawNotes?: string;
  category?: string;
  tone?: string;
  language?: string;
  targetLength?: string;
  sourceContext?: string;
  articleContext?: string;
  mediaAssetIds?: string[];
  mediaContext?: Record<string, string>;
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

type AvailableArticleMedia = {
  mediaAssetId: string;
  publicUrl: string;
  originalName: string;
  altText: string;
  caption: string;
  context: string;
};

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

async function uniqueArticleSlug(input: string) {
  const base = slugify(input) || "untitled-article";
  let candidate = base;
  let attempt = 0;

  while (await prisma.article.findUnique({ where: { slug: candidate } })) {
    attempt++;
    candidate = `${base}-${attempt}`;
  }

  return candidate;
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

function pickAlign(value: unknown, fallback = "left") {
  const align = pickString(value, fallback);
  return ["left", "center", "right", "justify"].includes(align) ? align : fallback;
}

function pickArticleMedia(
  content: Record<string, unknown>,
  mediaById: Map<string, AvailableArticleMedia>,
  mediaByUrl: Map<string, AvailableArticleMedia>,
) {
  const mediaAssetId = pickString(content.mediaAssetId);
  const src = pickString(content.src || content.publicUrl);
  const media = (mediaAssetId ? mediaById.get(mediaAssetId) : null) ?? (src ? mediaByUrl.get(src) : null);
  if (!media) return null;

  return {
    mediaAssetId: media.mediaAssetId,
    src: media.publicUrl,
    alt: pickString(content.alt, media.altText || media.originalName),
    caption: pickString(content.caption, media.caption),
  };
}

function normalizeGeneratedBlock(
  block: BlockInput,
  mediaById: Map<string, AvailableArticleMedia>,
  mediaByUrl: Map<string, AvailableArticleMedia>,
): BlockInput | null {
  const type = pickString(block.type, "paragraph");
  const content = block.contentJson && typeof block.contentJson === "object" && !Array.isArray(block.contentJson)
    ? (block.contentJson as Record<string, unknown>)
    : {};

  if (type === "paragraph") {
    const text = pickString(content.text);
    if (!text) return null;
    return { type, contentJson: { text, align: pickAlign(content.align) } };
  }

  if (type === "heading") {
    const text = pickString(content.text, "Untitled section");
    const level = pickNumber(content.level, 2);
    return {
      type,
      contentJson: {
        text,
        level: [2, 3, 4].includes(level) ? level : 2,
        align: pickAlign(content.align),
      },
    };
  }

  if (type === "image") {
    const media = pickArticleMedia(content, mediaById, mediaByUrl);
    if (!media) return null;
    const layout = pickString(content.layout, "inline");
    return {
      type,
      contentJson: {
        ...media,
        layout: ["inline", "full"].includes(layout) ? layout : "inline",
      },
    };
  }

  if (type === "gallery") {
    const images = Array.isArray(content.images)
      ? content.images
        .map((image) =>
          image && typeof image === "object" && !Array.isArray(image)
            ? pickArticleMedia(image as Record<string, unknown>, mediaById, mediaByUrl)
            : null,
        )
        .filter((image): image is NonNullable<typeof image> => Boolean(image))
      : [];
    if (images.length === 0) return null;
    const layout = pickString(content.layout, "grid");
    return {
      type,
      contentJson: {
        layout: ["grid", "carousel"].includes(layout) ? layout : "grid",
        images,
      },
    };
  }

  if (type === "quote") {
    const text = pickString(content.text);
    if (!text) return null;
    return { type, contentJson: { text, source: pickString(content.source) } };
  }

  if (type === "callout") {
    const text = pickString(content.text);
    if (!text) return null;
    const variant = pickString(content.variant, "note");
    return {
      type,
      contentJson: {
        variant: ["note", "success", "warning"].includes(variant) ? variant : "note",
        title: pickString(content.title),
        text,
      },
    };
  }

  if (type === "list") {
    const items = Array.isArray(content.items) ? content.items.map((item) => pickString(item)).filter(Boolean) : [];
    if (items.length === 0) return null;
    return {
      type,
      contentJson: {
        style: pickString(content.style) === "number" ? "number" : "bullet",
        items,
      },
    };
  }

  if (type === "code") {
    const code = pickString(content.code);
    if (!code) return null;
    return { type, contentJson: { code, language: pickString(content.language) } };
  }

  if (type === "divider") {
    return { type, contentJson: {} };
  }

  const text = pickString(content.text);
  return text ? { type: "paragraph", contentJson: { text, align: "left" } } : null;
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

  app.post<{ Body: ArticleGenerateDraftBody }>(
    "/api/admin/articles/generate-draft",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      if (!config.articleGenerateWebhookUrl) {
        return reply.code(503).send({ message: "Article generator webhook is not configured." });
      }

      const rawNotes = pickString(request.body.rawNotes);
      const category = pickString(request.body.category, "Reflection");
      if (!rawNotes || !category) {
        return reply.code(400).send({ message: "Raw notes and category are required." });
      }

      const mediaAssetIds = Array.isArray(request.body.mediaAssetIds)
        ? request.body.mediaAssetIds.map((id) => pickString(id)).filter(Boolean).slice(0, 12)
        : [];
      const mediaAssets = mediaAssetIds.length > 0
        ? await prisma.mediaAsset.findMany({
          where: {
            id: { in: mediaAssetIds },
            mimeType: { startsWith: "image/" },
          },
        })
        : [];
      const mediaByAssetId = new Map(mediaAssets.map((asset) => [asset.id, asset]));
      const mediaContext: Record<string, string> = request.body.mediaContext && typeof request.body.mediaContext === "object"
        ? request.body.mediaContext
        : {};
      const availableMedia: AvailableArticleMedia[] = mediaAssetIds
        .map((id) => mediaByAssetId.get(id))
        .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
        .map((asset) => ({
          mediaAssetId: asset.id,
          publicUrl: asset.publicUrl,
          originalName: asset.originalName,
          altText: asset.altText ?? "",
          caption: asset.caption ?? "",
          context: pickString(mediaContext[asset.id]),
        }));

      let generated: ArticleBody & { error?: string; data?: ArticleBody };
      try {
        const response = await fetch(config.articleGenerateWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.articleGenerateSecret ? { "X-Portfolio-Generator-Secret": config.articleGenerateSecret } : {}),
          },
          body: JSON.stringify({
            topic: pickString(request.body.topic),
            rawNotes,
            category,
            tone: pickString(request.body.tone, "reflective, grounded, personal, professional"),
            language: pickString(request.body.language, "English"),
            targetLength: pickString(request.body.targetLength, "medium"),
            sourceContext: pickString(request.body.sourceContext),
            articleContext: pickString(request.body.articleContext, articleWritingContextMarkdown),
            availableMedia,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          return reply.code(502).send({ message: `Article generator failed: ${response.status}${text ? ` ${text.slice(0, 180)}` : ""}` });
        }

        generated = await response.json() as ArticleBody & { error?: string; data?: ArticleBody };
      } catch (error) {
        return reply.code(502).send({ message: error instanceof Error ? error.message : "Could not reach article generator." });
      }

      const articleDraft = generated.data ?? generated;
      if (generated.error || !articleDraft || typeof articleDraft !== "object") {
        return reply.code(502).send({ message: generated.error || "Article generator returned an invalid response." });
      }

      const mediaById = new Map(availableMedia.map((media) => [media.mediaAssetId, media]));
      const mediaByUrl = new Map(availableMedia.map((media) => [media.publicUrl, media]));
      const blocks = Array.isArray(articleDraft.blocks)
        ? articleDraft.blocks
          .map((block) => normalizeGeneratedBlock(block, mediaById, mediaByUrl))
          .filter((block): block is BlockInput => Boolean(block))
          .map((block, sortOrder) => ({ ...block, sortOrder }))
        : [];

      const fallbackParagraph = pickString(articleDraft.excerpt, "Draft generated from notes.");
      const title = pickString(articleDraft.title, pickString(request.body.topic, "Generated Article"));
      const excerpt = pickString(articleDraft.excerpt, fallbackParagraph);
      const normalizedArticle: ArticleBody = {
        title,
        slug: await uniqueArticleSlug(pickString(articleDraft.slug) || title),
        subtitle: pickString(articleDraft.subtitle),
        excerpt,
        category: pickString(articleDraft.category, category),
        status: "generated",
        isFeatured: false,
        coverAssetId: mediaAssetIds.includes(pickString(articleDraft.coverAssetId)) ? pickString(articleDraft.coverAssetId) : undefined,
        seoTitle: pickString(articleDraft.seoTitle, title),
        seoDescription: pickString(articleDraft.seoDescription, excerpt),
        authorName: pickString(articleDraft.authorName, "Oktavianus Samuel"),
        authorRole: pickString(articleDraft.authorRole),
        tags: toTagArray(articleDraft.tags).slice(0, 8),
        blocks: blocks.length > 0 ? blocks : [
          {
            type: "paragraph",
            contentJson: { text: fallbackParagraph, align: "left" },
            sortOrder: 0,
          },
        ],
      };

      const data = articleBaseData(normalizedArticle);
      if (!data.title || !data.excerpt || !data.category) {
        return reply.code(502).send({ message: "Article generator did not return the required article fields." });
      }

      const article = await prisma.$transaction(async (tx) => {
        const created = await tx.article.create({
          data: {
            ...data,
            publishedAt: null,
          },
        });
        await replaceArticleChildren(tx, created.id, normalizedArticle);
        return tx.article.findUniqueOrThrow({
          where: { id: created.id },
          include: includeArticleRelations,
        });
      });

      return reply.code(201).send({ data: serializeArticle(article) });
    },
  );

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
