import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { pickBoolean, pickNumber, pickString, slugify } from "../lib/strings.js";

const categoryScopes = ["article", "project", "experience"] as const;
type CategoryScope = (typeof categoryScopes)[number];

type CategoryBody = {
  scope?: string;
  label?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
};

function isCategoryScope(value: string): value is CategoryScope {
  return categoryScopes.includes(value as CategoryScope);
}

function normalizeScope(value: string | undefined) {
  const scope = pickString(value).toLowerCase();
  return isCategoryScope(scope) ? scope : null;
}

function categoryBaseData(body: CategoryBody) {
  const label = pickString(body.label);
  return {
    scope: normalizeScope(body.scope),
    label,
    slug: pickString(body.slug) || slugify(label),
    description: pickString(body.description) || null,
    isActive: pickBoolean(body.isActive ?? true),
    sortOrder: pickNumber(body.sortOrder, 0),
  };
}

async function usageCount(scope: CategoryScope, label: string) {
  if (scope === "article") return prisma.article.count({ where: { category: label } });
  if (scope === "project") return prisma.project.count({ where: { category: label } });
  return prisma.experience.count({ where: { category: label } });
}

async function syncRenamedCategory(tx: Prisma.TransactionClient, scope: CategoryScope, from: string, to: string) {
  if (from === to) return;
  if (scope === "article") {
    await tx.article.updateMany({ where: { category: from }, data: { category: to } });
  }
  if (scope === "project") {
    await tx.project.updateMany({ where: { category: from }, data: { category: to } });
  }
  if (scope === "experience") {
    await tx.experience.updateMany({ where: { category: from }, data: { category: to } });
  }
}

async function serializeCategory(category: {
  id: string;
  scope: string;
  label: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  const scope = normalizeScope(category.scope);
  return {
    ...category,
    usageCount: scope ? await usageCount(scope, category.label) : 0,
  };
}

export async function categoryRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { scope?: string } }>("/api/public/categories", async (request) => {
    const scope = normalizeScope(request.query.scope);
    if (!scope) return { data: [] };

    const categories = await prisma.contentCategory.findMany({
      where: { scope, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    return { data: await Promise.all(categories.map(serializeCategory)) };
  });

  app.get<{ Querystring: { scope?: string } }>("/api/admin/categories", { preHandler: app.requireAdmin }, async (request) => {
    const scope = normalizeScope(request.query.scope);

    const categories = await prisma.contentCategory.findMany({
      where: scope ? { scope } : undefined,
      orderBy: [{ scope: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });

    return { data: await Promise.all(categories.map(serializeCategory)) };
  });

  app.post<{ Body: CategoryBody }>("/api/admin/categories", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = categoryBaseData(request.body);
    if (!data.scope || !data.label || !data.slug) {
      return reply.code(400).send({ message: "Scope, label, and slug are required" });
    }
    const scope = data.scope;

    const category = await prisma.contentCategory.create({
      data: {
        scope,
        label: data.label,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    await writeAuditLog(request, {
      action: "create",
      entityType: "category",
      entityId: category.id,
      entityLabel: category.label,
      metadata: {
        scope: category.scope,
      },
    });

    return reply.code(201).send({ data: await serializeCategory(category) });
  });

  app.patch<{ Params: { id: string }; Body: CategoryBody }>("/api/admin/categories/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const existing = await prisma.contentCategory.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ message: "Category not found" });

    const data = categoryBaseData({ ...request.body, scope: request.body.scope ?? existing.scope });
    if (!data.scope || !data.label || !data.slug) {
      return reply.code(400).send({ message: "Scope, label, and slug are required" });
    }
    const scope = data.scope;

    const category = await prisma.$transaction(async (tx) => {
      if (existing.scope === scope) {
        await syncRenamedCategory(tx, existing.scope as CategoryScope, existing.label, data.label);
      }
      return tx.contentCategory.update({
        where: { id: request.params.id },
        data: {
          scope,
          label: data.label,
          slug: data.slug,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      });
    });

    await writeAuditLog(request, {
      action: "update",
      entityType: "category",
      entityId: category.id,
      entityLabel: category.label,
      metadata: {
        scope: category.scope,
        previousLabel: existing.label,
        previousScope: existing.scope,
      },
    });

    return { data: await serializeCategory(category) };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/categories/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const existing = await prisma.contentCategory.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ message: "Category not found" });

    await prisma.contentCategory.delete({ where: { id: request.params.id } });
    await writeAuditLog(request, {
      action: "delete",
      entityType: "category",
      entityId: existing.id,
      entityLabel: existing.label,
      metadata: {
        scope: existing.scope,
      },
    });
    return { ok: true };
  });

  app.post<{ Body: { ids?: string[] } }>("/api/admin/categories/reorder", { preHandler: app.requireAdmin }, async (request) => {
    const ids = Array.isArray(request.body.ids) ? request.body.ids : [];
    await prisma.$transaction(
      ids.map((id, sortOrder) =>
        prisma.contentCategory.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );
    await writeAuditLog(request, {
      action: "reorder",
      entityType: "category",
      metadata: {
        count: ids.length,
      },
    });
    return { ok: true };
  });
}
