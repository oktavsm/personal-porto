import bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";

const cookieName = "teladan_admin_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function revokeSession(token?: string) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export function getSessionToken(request: FastifyRequest) {
  const cookieToken = request.cookies[cookieName];
  if (cookieToken) return cookieToken;

  const authorization = request.headers.authorization;
  if (!authorization) return undefined;

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  reply.setCookie(cookieName, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    expires: expiresAt,
    maxAge,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(cookieName, { path: "/" });
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = getSessionToken(request);

  if (!token) {
    return reply.code(401).send({ message: "Authentication required" });
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    clearSessionCookie(reply);
    return reply.code(401).send({ message: "Session expired" });
  }

  request.adminUser = session.user;
}

export async function authPlugin(app: FastifyInstance) {
  app.decorate("requireAdmin", requireAdmin);
}

declare module "fastify" {
  interface FastifyInstance {
    requireAdmin: typeof requireAdmin;
  }
}
