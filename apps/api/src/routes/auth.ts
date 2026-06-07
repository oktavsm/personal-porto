import type { FastifyInstance } from "fastify";
import { clearSessionCookie, createSession, getSessionTokens, hashPassword, revokeSessions, setSessionCookie, verifyPassword } from "../plugins/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";

type LoginBody = {
  email?: string;
  password?: string;
};

type ChangePasswordBody = {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>("/api/admin/auth/login", async (request, reply) => {
    const email = request.body.email?.trim().toLowerCase();
    const password = request.body.password ?? "";

    if (!email || !password) {
      return reply.code(400).send({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session.token, session.expiresAt);

    return {
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  app.post("/api/admin/auth/logout", async (request, reply) => {
    await revokeSessions(getSessionTokens(request));
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/admin/me", { preHandler: app.requireAdmin }, async (request, reply) => {
    if (!request.adminUser) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    return {
      user: {
        id: request.adminUser.id,
        email: request.adminUser.email,
        name: request.adminUser.name,
        role: request.adminUser.role,
      },
    };
  });

  app.patch<{ Body: ChangePasswordBody }>("/api/admin/auth/password", async (request, reply) => {
    const email = request.body.email?.trim().toLowerCase();
    const currentPassword = request.body.currentPassword ?? "";
    const newPassword = request.body.newPassword ?? "";

    if (!email || !currentPassword || !newPassword) {
      return reply.code(400).send({ message: "Email, current password, and new password are required" });
    }

    if (newPassword.length < 10) {
      return reply.code(400).send({ message: "New password must be at least 10 characters" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return reply.code(400).send({ message: "Current password is incorrect" });
    }

    if (await verifyPassword(newPassword, user.passwordHash)) {
      return reply.code(400).send({ message: "New password must be different from the current password" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });
    const session = await createSession(user.id);
    setSessionCookie(reply, session.token, session.expiresAt);

    await writeAuditLog(request, {
      action: "update",
      entityType: "auth",
      entityId: user.id,
      entityLabel: user.email,
      metadata: { rotatedSessions: true },
    });

    return {
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });
}
