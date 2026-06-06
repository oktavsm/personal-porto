import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { applyReorder, pickReorderIds, type ReorderBody } from "../lib/reorder.js";
import { pickBoolean, pickNumber, pickString } from "../lib/strings.js";

type MusicBody = {
  title?: string;
  artist?: string;
  note?: string;
  audioAssetId?: string;
  coverAssetId?: string;
  isActive?: boolean;
  sortOrder?: number;
};

const includeMusicAssets = {
  audioAsset: true,
  coverAsset: true,
};

type MusicTrackWithAssets = Prisma.MusicTrackGetPayload<{ include: typeof includeMusicAssets }>;

function musicData(body: MusicBody) {
  return {
    title: pickString(body.title),
    artist: pickString(body.artist),
    note: pickString(body.note),
    audioAssetId: pickString(body.audioAssetId) || null,
    coverAssetId: pickString(body.coverAssetId) || null,
    isActive: pickBoolean(body.isActive, true),
    sortOrder: pickNumber(body.sortOrder),
  };
}

function serializeTrack(track: MusicTrackWithAssets) {
  return {
    ...track,
    audioUrl: track.audioAsset?.publicUrl ?? null,
    audioOriginalName: track.audioAsset?.originalName ?? null,
    coverUrl: track.coverAsset?.publicUrl ?? null,
    coverOriginalName: track.coverAsset?.originalName ?? null,
  };
}

export async function musicRoutes(app: FastifyInstance) {
  app.get("/api/public/music", async () => {
    const data = await prisma.musicTrack.findMany({
      where: {
        isActive: true,
        audioAssetId: { not: null },
        coverAssetId: { not: null },
      },
      include: includeMusicAssets,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return { data: data.map(serializeTrack) };
  });

  app.get("/api/admin/music", { preHandler: app.requireAdmin }, async () => {
    const data = await prisma.musicTrack.findMany({
      include: includeMusicAssets,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return { data: data.map(serializeTrack) };
  });

  app.post<{ Body: MusicBody }>("/api/admin/music", { preHandler: app.requireAdmin }, async (request, reply) => {
    const data = musicData(request.body);
    if (!data.title || !data.artist || !data.note) {
      return reply.code(400).send({ message: "Title, artist, and note are required" });
    }

    const track = await prisma.musicTrack.create({
      data,
      include: includeMusicAssets,
    });
    await writeAuditLog(request, {
      action: "create",
      entityType: "music",
      entityId: track.id,
      entityLabel: track.title,
      metadata: { artist: track.artist, isActive: track.isActive },
    });
    return reply.code(201).send({ data: serializeTrack(track) });
  });

  app.post<{ Body: ReorderBody }>("/api/admin/music/reorder", { preHandler: app.requireAdmin }, async (request, reply) => {
    const ids = pickReorderIds(request.body);
    if (ids.length === 0) return reply.code(400).send({ message: "ids are required" });
    await prisma.$transaction((tx) => applyReorder(tx, "musicTrack", ids));
    await writeAuditLog(request, {
      action: "reorder",
      entityType: "music",
      metadata: { count: ids.length },
    });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: MusicBody }>("/api/admin/music/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.musicTrack.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Music track not found" });

    const data = musicData(request.body);
    if (!data.title || !data.artist || !data.note) {
      return reply.code(400).send({ message: "Title, artist, and note are required" });
    }

    const track = await prisma.musicTrack.update({
      where: { id: request.params.id },
      data,
      include: includeMusicAssets,
    });
    await writeAuditLog(request, {
      action: "update",
      entityType: "music",
      entityId: track.id,
      entityLabel: track.title,
      metadata: { previousTitle: exists.title, artist: track.artist, isActive: track.isActive },
    });
    return { data: serializeTrack(track) };
  });

  app.delete<{ Params: { id: string } }>("/api/admin/music/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const exists = await prisma.musicTrack.findUnique({ where: { id: request.params.id } });
    if (!exists) return reply.code(404).send({ message: "Music track not found" });
    await prisma.musicTrack.delete({ where: { id: request.params.id } });
    await writeAuditLog(request, {
      action: "delete",
      entityType: "music",
      entityId: exists.id,
      entityLabel: exists.title,
      metadata: { artist: exists.artist, isActive: exists.isActive },
    });
    return { ok: true };
  });
}
