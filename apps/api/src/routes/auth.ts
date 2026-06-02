import type { FastifyInstance } from "fastify";
import { clearSessionCookie, createSession, getSessionToken, revokeSession, setSessionCookie, verifyPassword } from "../plugins/auth.js";
import { prisma } from "../lib/prisma.js";

type LoginBody = {
  email?: string;
  password?: string;
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
    await revokeSession(getSessionToken(request));
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
}
