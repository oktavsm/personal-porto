import type { Prisma } from "@prisma/client";

export type ReorderBody = {
  ids?: string[];
};

export function pickReorderIds(body: ReorderBody) {
  return Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
}

export function reorderUpdates(ids: string[]) {
  return ids.map((id, index) => ({ id, sortOrder: index + 1 }));
}

export async function applyReorder(
  tx: Prisma.TransactionClient,
  model: "project" | "experience" | "certification" | "liveSystem" | "contactLink" | "musicTrack",
  ids: string[],
) {
  await Promise.all(
    reorderUpdates(ids).map(({ id, sortOrder }) => {
      if (model === "project") return tx.project.update({ where: { id }, data: { sortOrder } });
      if (model === "experience") return tx.experience.update({ where: { id }, data: { sortOrder } });
      if (model === "certification") return tx.certification.update({ where: { id }, data: { sortOrder } });
      if (model === "liveSystem") return tx.liveSystem.update({ where: { id }, data: { sortOrder } });
      if (model === "contactLink") return tx.contactLink.update({ where: { id }, data: { sortOrder } });
      return tx.musicTrack.update({ where: { id }, data: { sortOrder } });
    }),
  );
}
