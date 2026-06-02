import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString, toStringArray } from "../lib/strings.js";

type CertificationBody = {
  title?: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  credentialUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  skills?: string[] | string;
};

const includeSkills = {
  skills: { orderBy: { sortOrder: "asc" as const } },
};

function serializeCertification(certification: Awaited<ReturnType<typeof prisma.certification.findFirst>> & { skills?: { label: string }[] }) {
  if (!certification) return certification;
  return {
    ...certification,
    skills: certification.skills?.map((skill) => skill.label) ?? [],
  };
}

function certificationData(body: CertificationBody) {
  return {
    title: pickString(body.title),
    issuer: pickString(body.issuer),
    issuedAt: pickString(body.issuedAt),
    expiresAt: pickString(body.expiresAt) || null,
    credentialUrl: pickString(body.credentialUrl) || null,
    isFeatured: pickBoolean(body.isFeatured),
    sortOrder: pickNumber(body.sortOrder),
  };
}

export async function certificationRoutes(app: FastifyInstance) {
  app.get("/api/public/certifications", async () => {
    const data = await prisma.certification.findMany({
      include: includeSkills,
      orderBy: [{ sortOrder: "asc" }, { issuedAt: "desc" }],
    });
    return { data: data.map(serializeCertification) };
  });

  app.get("/api/admin/certifications", { preHandler: app.requireAdmin }, async () => {
    const data = await prisma.certification.findMany({
      include: includeSkills,
      orderBy: [{ sortOrder: "asc" }, { issuedAt: "desc" }],
    });
    return { data: data.map(serializeCertification) };
  });

  app.post<{ Body: CertificationBody }>("/api/admin/certifications", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = certificationData(request.body);
    if (!data.title || !data.issuer || !data.issuedAt) {
      return reply.code(400).send({ message: "Title, issuer, and issuedAt are required" });
    }

    const skills = toStringArray(request.body.skills);
    const certification = await prisma.certification.create({
      data: {
        ...data,
        skills: {
          create: skills.map((label, sortOrder) => ({ label, sortOrder })),
        },
      },
      include: includeSkills,
    });

    return reply.code(201).send({ data: serializeCertification(certification) });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/certifications/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "certification", ids));
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: CertificationBody }>(
    "/api/admin/certifications/:id",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const exists = await prisma.certification.findUnique({ where: { id: request.params.id } });
      if (!exists) return reply.code(404).send({ message: "Certification not found" });

      const skills = toStringArray(request.body.skills);
      const certification = await prisma.$transaction(async (tx) => {
        await tx.certificationSkill.deleteMany({ where: { certificationId: request.params.id } });
        return tx.certification.update({
          where: { id: request.params.id },
          data: {
            ...certificationData(request.body),
            skills: {
              create: skills.map((label, sortOrder) => ({ label, sortOrder })),
            },
          },
          include: includeSkills,
        });
      });

      return { data: serializeCertification(certification) };
    },
  );

  app.delete<{ Params: { id: string } }>("/api/admin/certifications/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.certification.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Certification not found" });
    await prisma.certification.delete({ where: { id: request.params.id } });
    return { ok: true };
  });
}
