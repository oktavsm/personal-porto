import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString } from "../lib/strings.js";

type CoreServerNodeBody = {
  label?: string;
  description?: string;
  href?: string;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
  isPublished?: boolean;
};

function coreNodeData(body: CoreServerNodeBody) {
  return {
    label: pickString(body.label),
    description: pickString(body.description),
    href: pickString(body.href),
    positionX: body.positionX !== undefined ? Number(body.positionX) : undefined,
    positionY: body.positionY !== undefined ? Number(body.positionY) : undefined,
    sortOrder: body.sortOrder !== undefined ? pickNumber(body.sortOrder) : undefined,
    isPublished: body.isPublished !== undefined ? pickBoolean(body.isPublished, true) : undefined,
  };
}

export async function coreServerNodeRoutes(app: FastifyInstance) {
  // Public — consumed by CoreServerMap on home page
  app.get("/api/public/core-nodes", async () => ({
    data: await prisma.coreServerNode.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
  }));

  // Admin — full list
  app.get("/api/admin/core-nodes", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.coreServerNode.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
  }));

  // Admin — create
  app.post<{ Body: CoreServerNodeBody }>("/api/admin/core-nodes", { preHandler: app.requireAdmin }, async (request, reply) => {
    const { label, description, href, positionX, positionY, sortOrder, isPublished } = coreNodeData(request.body);
    if (!label || !description || !href) {
      return reply.code(400).send({ message: "Label, description, and href are required" });
    }

    const node = await prisma.coreServerNode.create({
      data: {
        label,
        description,
        href,
        positionX: positionX ?? 50,
        positionY: positionY ?? 50,
        sortOrder: sortOrder ?? 0,
        isPublished: isPublished ?? true,
      },
    });
    await writeAuditLog(request, {
      action: "create",
      entityType: "core_node",
      entityId: node.id,
      entityLabel: node.label,
      metadata: { href: node.href },
    });
    return reply.code(201).send({ data: node });
  });

  // Admin — reorder
  app.post<{ Body: ReorderBody }>("/api/admin/core-nodes/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "coreServerNode", ids));
    await writeAuditLog(request, {
      action: "reorder",
      entityType: "core_node",
      metadata: { count: ids.length },
    });
    return { ok: true };
  });

  // Admin — update
  app.patch<{ Params: { id: string }; Body: CoreServerNodeBody }>("/api/admin/core-nodes/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.coreServerNode.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Core node not found" });

    const data = coreNodeData(request.body);
    // Remove undefined fields so they don't overwrite existing values
    const updateData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));

    const node = await prisma.coreServerNode.update({
      where: { id: request.params.id },
      data: updateData,
    });
    await writeAuditLog(request, {
      action: "update",
      entityType: "core_node",
      entityId: node.id,
      entityLabel: node.label,
      metadata: { href: node.href, previousLabel: exists.label },
    });
    return { data: node };
  });

  // Admin — delete
  app.delete<{ Params: { id: string } }>("/api/admin/core-nodes/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.coreServerNode.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Core node not found" });
    await prisma.coreServerNode.delete({ where: { id: request.params.id } });
    await writeAuditLog(request, {
      action: "delete",
      entityType: "core_node",
      entityId: exists.id,
      entityLabel: exists.label,
      metadata: { href: exists.href },
    });
    return { ok: true };
  });
}
