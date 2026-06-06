import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { pickNumber, pickString } from "../lib/strings.js";

export async function auditRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string; entityType?: string } }>(
    "/api/admin/audit-logs",
    { preHandler: app.requireAdmin },
    async (request) => {
      const take = Math.min(Math.max(pickNumber(request.query.limit, 50), 1), 100);
      const entityType = pickString(request.query.entityType);

      const logs = await prisma.auditLog.findMany({
        where: entityType ? { entityType } : undefined,
        orderBy: { createdAt: "desc" },
        take,
      });

      return { data: logs };
    },
  );
}
