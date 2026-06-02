import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString } from "../lib/strings.js";

type ContactBody = {
  type?: string;
  label?: string;
  value?: string;
  url?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

function contactData(body: ContactBody) {
  return {
    type: pickString(body.type),
    label: pickString(body.label),
    value: pickString(body.value) || null,
    url: pickString(body.url),
    isPrimary: pickBoolean(body.isPrimary),
    sortOrder: pickNumber(body.sortOrder),
  };
}

export async function contactRoutes(app: FastifyInstance) {
  app.get("/api/public/contact", async () => ({
    data: await prisma.contactLink.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
  }));

  app.get("/api/admin/contact", { preHandler: app.requireAdmin }, async () => ({
    data: await prisma.contactLink.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
  }));

  app.post<{ Body: ContactBody }>("/api/admin/contact", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = contactData(request.body);
    if (!data.type || !data.label || !data.url) {
      return reply.code(400).send({ message: "Type, label, and URL are required" });
    }
    const link = await prisma.contactLink.create({ data });
    return reply.code(201).send({ data: link });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/contact/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "contactLink", ids));
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: ContactBody }>("/api/admin/contact/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.contactLink.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Contact link not found" });
    const link = await prisma.contactLink.update({ where: { id: request.params.id }, data: contactData(request.body) });
    return { data: link };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/contact/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.contactLink.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Contact link not found" });
    await prisma.contactLink.delete({ where: { id: request.params.id } });
    return { ok: true };
  });
}
