import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";

export async function exportRoutes(app: FastifyInstance) {
  app.get("/api/admin/export", { preHandler: app.requireAdmin }, async (request, reply) => {
    const [
      projects,
      experiences,
      articles,
      categories,
      pages,
      certifications,
      systems,
      contacts,
      music,
      resumes,
      media,
      theme,
      contexts,
    ] = await Promise.all([
      prisma.project.findMany({
        include: {
          roles: { orderBy: { sortOrder: "asc" } },
          techStack: { orderBy: { sortOrder: "asc" } },
          links: { orderBy: { sortOrder: "asc" } },
          learnings: { orderBy: { sortOrder: "asc" } },
          media: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.experience.findMany({
        include: {
          responsibilities: { orderBy: { sortOrder: "asc" } },
          impacts: { orderBy: { sortOrder: "asc" } },
          values: { orderBy: { sortOrder: "asc" } },
          media: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.article.findMany({
        include: {
          blocks: { orderBy: { sortOrder: "asc" } },
          tags: { orderBy: { sortOrder: "asc" } },
          coverAsset: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.contentCategory.findMany({ orderBy: [{ scope: "asc" }, { sortOrder: "asc" }] }),
      prisma.sitePage.findMany({
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            include: { blocks: { orderBy: { sortOrder: "asc" } } },
          },
        },
        orderBy: { slug: "asc" },
      }),
      prisma.certification.findMany({
        include: { skills: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.liveSystem.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }),
      prisma.contactLink.findMany({ orderBy: [{ sortOrder: "asc" }] }),
      prisma.musicTrack.findMany({
        include: { audioAsset: true, coverAsset: true },
        orderBy: [{ sortOrder: "asc" }],
      }),
      prisma.resumeVersion.findMany({
        include: { mediaAsset: true },
        orderBy: [{ uploadedAt: "desc" }],
      }),
      prisma.mediaAsset.findMany({ orderBy: [{ createdAt: "desc" }] }),
      prisma.themeSetting.findMany({ orderBy: { key: "asc" } }),
      prisma.portfolioContextVersion.findMany({
        where: { isActive: true },
        orderBy: [{ label: "asc" }, { updatedAt: "desc" }],
      }),
    ]);

    const exportedAt = new Date().toISOString();
    const filename = `portfolio-cms-backup-${exportedAt.slice(0, 10)}.json`;
    const counts = {
      projects: projects.length,
      experiences: experiences.length,
      articles: articles.length,
      categories: categories.length,
      pages: pages.length,
      certifications: certifications.length,
      systems: systems.length,
      contacts: contacts.length,
      music: music.length,
      resumes: resumes.length,
      media: media.length,
      theme: theme.length,
      contexts: contexts.length,
    };

    await writeAuditLog(request, {
      action: "export",
      entityType: "cms-backup",
      entityLabel: filename,
      metadata: counts,
    });

    return reply
      .header("Content-Type", "application/json; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send({
        schemaVersion: 1,
        exportedAt,
        note: "Admin CMS backup. This export stores database metadata and media references, not binary upload files.",
        counts,
        data: {
          projects,
          experiences,
          articles,
          categories,
          pages,
          certifications,
          systems,
          contacts,
          music,
          resumes,
          media,
          theme,
          contexts,
        },
      });
  });
}
