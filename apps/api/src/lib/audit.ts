import type { Prisma } from "@prisma/client";
import type { FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";

type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(request: FastifyRequest, input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: request.adminUser?.id ?? null,
        actorEmail: request.adminUser?.email ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    request.log.warn({ error }, "Failed to write audit log");
  }
}
