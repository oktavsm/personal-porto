import { Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";

type BackupDataKey =
  | "projects"
  | "experiences"
  | "articles"
  | "categories"
  | "pages"
  | "certifications"
  | "systems"
  | "contacts"
  | "music"
  | "resumes"
  | "media"
  | "theme"
  | "contexts";

type BackupRecord = Record<string, unknown>;

type BackupPayload = {
  schemaVersion?: unknown;
  exportedAt?: unknown;
  counts?: Record<string, unknown>;
  data?: Partial<Record<BackupDataKey, unknown>>;
};

const backupKeys: BackupDataKey[] = [
  "projects",
  "experiences",
  "articles",
  "categories",
  "pages",
  "certifications",
  "systems",
  "contacts",
  "music",
  "resumes",
  "media",
  "theme",
  "contexts",
];

function records(payload: BackupPayload, key: BackupDataKey): BackupRecord[] {
  const value = payload.data?.[key];
  return Array.isArray(value) ? value.filter((item): item is BackupRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown) {
  const text = stringValue(value).trim();
  return text || null;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function dateValue(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

function childRecords(record: BackupRecord, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is BackupRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

async function readBackupPayload(request: FastifyRequest): Promise<BackupPayload> {
  const upload = await request.file();
  if (!upload) {
    throw new Error("Backup JSON file is required.");
  }

  const buffer = await upload.toBuffer();
  const payload = JSON.parse(buffer.toString("utf8")) as BackupPayload;
  if (!payload || typeof payload !== "object" || !payload.data || typeof payload.data !== "object") {
    throw new Error("Invalid CMS backup format.");
  }

  return payload;
}

function summarizeBackup(payload: BackupPayload) {
  const counts = Object.fromEntries(backupKeys.map((key) => [key, records(payload, key).length]));
  const warnings = [
    "Import uses merge mode: matching records are updated, missing records are created, and records not listed in this backup are kept.",
    "Media database references can be restored, but uploaded binary files must already exist on the server.",
  ];

  return {
    schemaVersion: numberValue(payload.schemaVersion, 1),
    exportedAt: stringValue(payload.exportedAt, "unknown"),
    counts,
    warnings,
  };
}

async function importMedia(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "media")) {
    const id = stringValue(item.id);
    if (!id) continue;
    await prisma.mediaAsset.upsert({
      where: { id },
      update: {
        filename: stringValue(item.filename),
        originalName: stringValue(item.originalName),
        mimeType: stringValue(item.mimeType),
        sizeBytes: numberValue(item.sizeBytes),
        storagePath: stringValue(item.storagePath),
        publicUrl: stringValue(item.publicUrl),
        altText: optionalString(item.altText),
        caption: optionalString(item.caption),
      },
      create: {
        id,
        filename: stringValue(item.filename),
        originalName: stringValue(item.originalName),
        mimeType: stringValue(item.mimeType),
        sizeBytes: numberValue(item.sizeBytes),
        storagePath: stringValue(item.storagePath),
        publicUrl: stringValue(item.publicUrl),
        altText: optionalString(item.altText),
        caption: optionalString(item.caption),
        createdAt: dateValue(item.createdAt),
      },
    });
    count++;
  }
  return count;
}

async function importCategories(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "categories")) {
    const id = stringValue(item.id);
    const scope = stringValue(item.scope);
    const slug = stringValue(item.slug);
    if (!scope || !slug) continue;
    await prisma.contentCategory.upsert({
      where: { scope_slug: { scope, slug } },
      update: {
        label: stringValue(item.label),
        description: optionalString(item.description),
        isActive: booleanValue(item.isActive, true),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id: id || undefined,
        scope,
        slug,
        label: stringValue(item.label),
        description: optionalString(item.description),
        isActive: booleanValue(item.isActive, true),
        sortOrder: numberValue(item.sortOrder),
        createdAt: dateValue(item.createdAt),
      },
    });
    count++;
  }
  return count;
}

async function importTheme(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "theme")) {
    const key = stringValue(item.key);
    const value = stringValue(item.value);
    if (!key) continue;
    await prisma.themeSetting.upsert({
      where: { key },
      update: { value },
      create: { id: stringValue(item.id) || undefined, key, value },
    });
    count++;
  }
  return count;
}

async function importSimpleTables(payload: BackupPayload) {
  let systems = 0;
  for (const item of records(payload, "systems")) {
    const id = stringValue(item.id);
    const slug = stringValue(item.slug);
    if (!slug) continue;
    await prisma.liveSystem.upsert({
      where: { slug },
      update: {
        slug,
        title: stringValue(item.title),
        description: stringValue(item.description),
        url: stringValue(item.url),
        embedUrl: optionalString(item.embedUrl),
        isEmbeddable: booleanValue(item.isEmbeddable, true),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id: id || undefined,
        slug,
        title: stringValue(item.title),
        description: stringValue(item.description),
        url: stringValue(item.url),
        embedUrl: optionalString(item.embedUrl),
        isEmbeddable: booleanValue(item.isEmbeddable, true),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
        createdAt: dateValue(item.createdAt),
      },
    });
    systems++;
  }

  let contacts = 0;
  for (const item of records(payload, "contacts")) {
    const id = stringValue(item.id);
    if (!id) continue;
    await prisma.contactLink.upsert({
      where: { id },
      update: {
        type: stringValue(item.type),
        label: stringValue(item.label),
        value: optionalString(item.value),
        url: stringValue(item.url),
        isPrimary: booleanValue(item.isPrimary),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id,
        type: stringValue(item.type),
        label: stringValue(item.label),
        value: optionalString(item.value),
        url: stringValue(item.url),
        isPrimary: booleanValue(item.isPrimary),
        sortOrder: numberValue(item.sortOrder),
      },
    });
    contacts++;
  }

  let resumes = 0;
  for (const item of records(payload, "resumes")) {
    const id = stringValue(item.id);
    if (!id) continue;
    await prisma.resumeVersion.upsert({
      where: { id },
      update: {
        label: stringValue(item.label),
        mediaAssetId: optionalString(item.mediaAssetId),
        isActive: booleanValue(item.isActive),
        notes: optionalString(item.notes),
      },
      create: {
        id,
        label: stringValue(item.label),
        mediaAssetId: optionalString(item.mediaAssetId),
        isActive: booleanValue(item.isActive),
        uploadedAt: dateValue(item.uploadedAt),
        notes: optionalString(item.notes),
      },
    });
    resumes++;
  }

  let music = 0;
  for (const item of records(payload, "music")) {
    const id = stringValue(item.id);
    if (!id) continue;
    await prisma.musicTrack.upsert({
      where: { id },
      update: {
        title: stringValue(item.title),
        artist: stringValue(item.artist),
        audioAssetId: optionalString(item.audioAssetId),
        coverAssetId: optionalString(item.coverAssetId),
        note: stringValue(item.note),
        isActive: booleanValue(item.isActive, true),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id,
        title: stringValue(item.title),
        artist: stringValue(item.artist),
        audioAssetId: optionalString(item.audioAssetId),
        coverAssetId: optionalString(item.coverAssetId),
        note: stringValue(item.note),
        isActive: booleanValue(item.isActive, true),
        sortOrder: numberValue(item.sortOrder),
      },
    });
    music++;
  }

  return { systems, contacts, resumes, music };
}

async function importCertifications(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "certifications")) {
    const id = stringValue(item.id);
    if (!id) continue;
    await prisma.certification.upsert({
      where: { id },
      update: {
        title: stringValue(item.title),
        issuer: stringValue(item.issuer),
        issuedAt: stringValue(item.issuedAt),
        expiresAt: optionalString(item.expiresAt),
        credentialUrl: optionalString(item.credentialUrl),
        isFeatured: booleanValue(item.isFeatured),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id,
        title: stringValue(item.title),
        issuer: stringValue(item.issuer),
        issuedAt: stringValue(item.issuedAt),
        expiresAt: optionalString(item.expiresAt),
        credentialUrl: optionalString(item.credentialUrl),
        isFeatured: booleanValue(item.isFeatured),
        sortOrder: numberValue(item.sortOrder),
        createdAt: dateValue(item.createdAt),
      },
    });
    await prisma.certificationSkill.deleteMany({ where: { certificationId: id } });
    const skills = childRecords(item, "skills").map((skill, index) => ({
        id: stringValue(skill.id) || undefined,
        certificationId: id,
        label: stringValue(skill.label),
        sortOrder: numberValue(skill.sortOrder, index),
      }));
    if (skills.length > 0) await prisma.certificationSkill.createMany({ data: skills });
    count++;
  }
  return count;
}

async function importProjects(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "projects")) {
    const id = stringValue(item.id);
    const slug = stringValue(item.slug);
    if (!slug) continue;
    const project = await prisma.project.upsert({
      where: { slug },
      update: {
        slug,
        title: stringValue(item.title),
        ecosystem: optionalString(item.ecosystem),
        category: stringValue(item.category),
        priority: stringValue(item.priority),
        summary: stringValue(item.summary),
        problem: stringValue(item.problem),
        solution: stringValue(item.solution),
        status: stringValue(item.status),
        isFeatured: booleanValue(item.isFeatured),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id: id || undefined,
        slug,
        title: stringValue(item.title),
        ecosystem: optionalString(item.ecosystem),
        category: stringValue(item.category),
        priority: stringValue(item.priority),
        summary: stringValue(item.summary),
        problem: stringValue(item.problem),
        solution: stringValue(item.solution),
        status: stringValue(item.status),
        isFeatured: booleanValue(item.isFeatured),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
        createdAt: dateValue(item.createdAt),
      },
    });
    const projectId = project.id;

    await prisma.projectRole.deleteMany({ where: { projectId } });
    await prisma.projectTechStack.deleteMany({ where: { projectId } });
    await prisma.projectLink.deleteMany({ where: { projectId } });
    await prisma.projectLearning.deleteMany({ where: { projectId } });
    await prisma.projectMedia.deleteMany({ where: { projectId } });

    const roles = childRecords(item, "roles").map((role, index) => ({
        id: stringValue(role.id) || undefined,
        projectId,
        label: stringValue(role.label),
        sortOrder: numberValue(role.sortOrder, index),
      }));
    if (roles.length > 0) await prisma.projectRole.createMany({ data: roles });

    const techStack = childRecords(item, "techStack").map((tech, index) => ({
        id: stringValue(tech.id) || undefined,
        projectId,
        label: stringValue(tech.label),
        sortOrder: numberValue(tech.sortOrder, index),
      }));
    if (techStack.length > 0) await prisma.projectTechStack.createMany({ data: techStack });

    const links = childRecords(item, "links").map((link, index) => ({
        id: stringValue(link.id) || undefined,
        projectId,
        type: stringValue(link.type),
        label: stringValue(link.label),
        url: stringValue(link.url),
        sortOrder: numberValue(link.sortOrder, index),
      }));
    if (links.length > 0) await prisma.projectLink.createMany({ data: links });

    const learnings = childRecords(item, "learnings").map((learning, index) => ({
        id: stringValue(learning.id) || undefined,
        projectId,
        text: stringValue(learning.text),
        sortOrder: numberValue(learning.sortOrder, index),
      }));
    if (learnings.length > 0) await prisma.projectLearning.createMany({ data: learnings });

    const projectMedia = childRecords(item, "media")
        .map((media, index) => ({
          id: stringValue(media.id) || undefined,
          projectId,
          mediaAssetId: stringValue(media.mediaAssetId),
          kind: stringValue(media.kind, "image"),
          sortOrder: numberValue(media.sortOrder, index),
        }))
        .filter((media) => media.mediaAssetId);
    if (projectMedia.length > 0) await prisma.projectMedia.createMany({ data: projectMedia });
    count++;
  }
  return count;
}

async function importExperiences(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "experiences")) {
    const id = stringValue(item.id);
    const slug = stringValue(item.slug);
    if (!slug) continue;
    const experience = await prisma.experience.upsert({
      where: { slug },
      update: {
        slug,
        title: stringValue(item.title),
        organization: stringValue(item.organization),
        period: stringValue(item.period),
        category: stringValue(item.category),
        summary: stringValue(item.summary),
        reflection: stringValue(item.reflection),
        isFeatured: booleanValue(item.isFeatured),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
      },
      create: {
        id: id || undefined,
        slug,
        title: stringValue(item.title),
        organization: stringValue(item.organization),
        period: stringValue(item.period),
        category: stringValue(item.category),
        summary: stringValue(item.summary),
        reflection: stringValue(item.reflection),
        isFeatured: booleanValue(item.isFeatured),
        isPublished: booleanValue(item.isPublished, true),
        sortOrder: numberValue(item.sortOrder),
        createdAt: dateValue(item.createdAt),
      },
    });
    const experienceId = experience.id;

    await prisma.experienceResponsibility.deleteMany({ where: { experienceId } });
    await prisma.experienceImpact.deleteMany({ where: { experienceId } });
    await prisma.experienceValue.deleteMany({ where: { experienceId } });
    await prisma.experienceMedia.deleteMany({ where: { experienceId } });

    const responsibilities = childRecords(item, "responsibilities").map((responsibility, index) => ({
        id: stringValue(responsibility.id) || undefined,
        experienceId,
        text: stringValue(responsibility.text),
        sortOrder: numberValue(responsibility.sortOrder, index),
      }));
    if (responsibilities.length > 0) await prisma.experienceResponsibility.createMany({ data: responsibilities });

    const impacts = childRecords(item, "impacts").map((impact, index) => ({
        id: stringValue(impact.id) || undefined,
        experienceId,
        text: stringValue(impact.text),
        sortOrder: numberValue(impact.sortOrder, index),
      }));
    if (impacts.length > 0) await prisma.experienceImpact.createMany({ data: impacts });

    const values = childRecords(item, "values").map((value, index) => ({
        id: stringValue(value.id) || undefined,
        experienceId,
        label: stringValue(value.label),
        sortOrder: numberValue(value.sortOrder, index),
      }));
    if (values.length > 0) await prisma.experienceValue.createMany({ data: values });

    const experienceMedia = childRecords(item, "media")
        .map((media, index) => ({
          id: stringValue(media.id) || undefined,
          experienceId,
          mediaAssetId: stringValue(media.mediaAssetId),
          kind: stringValue(media.kind, "image"),
          sortOrder: numberValue(media.sortOrder, index),
        }))
        .filter((media) => media.mediaAssetId);
    if (experienceMedia.length > 0) await prisma.experienceMedia.createMany({ data: experienceMedia });
    count++;
  }
  return count;
}

async function importPages(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "pages")) {
    const slug = stringValue(item.slug);
    if (!slug) continue;
    const page = await prisma.sitePage.upsert({
      where: { slug },
      update: {
        title: stringValue(item.title),
        description: optionalString(item.description),
      },
      create: {
        id: stringValue(item.id) || undefined,
        slug,
        title: stringValue(item.title),
        description: optionalString(item.description),
        createdAt: dateValue(item.createdAt),
      },
    });

    for (const section of childRecords(item, "sections")) {
      const key = stringValue(section.key);
      if (!key) continue;
      const savedSection = await prisma.siteSection.upsert({
        where: { pageId_key: { pageId: page.id, key } },
        update: {
          title: optionalString(section.title),
          subtitle: optionalString(section.subtitle),
          body: optionalString(section.body),
          settingsJson: jsonValue(section.settingsJson),
          sortOrder: numberValue(section.sortOrder),
          isPublished: booleanValue(section.isPublished, true),
        },
        create: {
          id: stringValue(section.id) || undefined,
          pageId: page.id,
          key,
          title: optionalString(section.title),
          subtitle: optionalString(section.subtitle),
          body: optionalString(section.body),
          settingsJson: jsonValue(section.settingsJson),
          sortOrder: numberValue(section.sortOrder),
          isPublished: booleanValue(section.isPublished, true),
        },
      });

      await prisma.contentBlock.deleteMany({ where: { sectionId: savedSection.id } });
      const blocks = childRecords(section, "blocks").map((block, index) => ({
          id: stringValue(block.id) || undefined,
          sectionId: savedSection.id,
          type: stringValue(block.type, "card"),
          contentJson: jsonValue(block.contentJson),
          sortOrder: numberValue(block.sortOrder, index),
          isPublished: booleanValue(block.isPublished, true),
        }));
      if (blocks.length > 0) await prisma.contentBlock.createMany({ data: blocks });
    }
    count++;
  }
  return count;
}

async function importArticles(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "articles")) {
    const id = stringValue(item.id);
    const slug = stringValue(item.slug);
    if (!slug) continue;
    const article = await prisma.article.upsert({
      where: { slug },
      update: {
        slug,
        title: stringValue(item.title),
        subtitle: optionalString(item.subtitle),
        excerpt: stringValue(item.excerpt),
        category: stringValue(item.category, "Reflection"),
        status: stringValue(item.status, "draft"),
        isFeatured: booleanValue(item.isFeatured),
        coverAssetId: optionalString(item.coverAssetId),
        seoTitle: optionalString(item.seoTitle),
        seoDescription: optionalString(item.seoDescription),
        generatorMeta: jsonValue(item.generatorMeta),
        language: stringValue(item.language, "en"),
        authorName: stringValue(item.authorName, "Oktavianus Samuel"),
        authorRole: optionalString(item.authorRole),
        publishedAt: dateValue(item.publishedAt) ?? null,
      },
      create: {
        id: id || undefined,
        slug,
        title: stringValue(item.title),
        subtitle: optionalString(item.subtitle),
        excerpt: stringValue(item.excerpt),
        category: stringValue(item.category, "Reflection"),
        status: stringValue(item.status, "draft"),
        isFeatured: booleanValue(item.isFeatured),
        coverAssetId: optionalString(item.coverAssetId),
        seoTitle: optionalString(item.seoTitle),
        seoDescription: optionalString(item.seoDescription),
        generatorMeta: jsonValue(item.generatorMeta),
        language: stringValue(item.language, "en"),
        authorName: stringValue(item.authorName, "Oktavianus Samuel"),
        authorRole: optionalString(item.authorRole),
        publishedAt: dateValue(item.publishedAt) ?? null,
        createdAt: dateValue(item.createdAt),
      },
    });
    const articleId = article.id;

    await prisma.articleBlock.deleteMany({ where: { articleId } });
    await prisma.articleTag.deleteMany({ where: { articleId } });
    const blocks = childRecords(item, "blocks").map((block, index) => ({
        id: stringValue(block.id) || undefined,
        articleId,
        type: stringValue(block.type, "paragraph"),
        contentJson: jsonValue(block.contentJson),
        sortOrder: numberValue(block.sortOrder, index),
      }));
    if (blocks.length > 0) await prisma.articleBlock.createMany({ data: blocks });

    const tags = childRecords(item, "tags").map((tag, index) => ({
        id: stringValue(tag.id) || undefined,
        articleId,
        label: stringValue(tag.label),
        sortOrder: numberValue(tag.sortOrder, index),
      }));
    if (tags.length > 0) await prisma.articleTag.createMany({ data: tags });
    count++;
  }
  return count;
}

async function importContexts(payload: BackupPayload) {
  let count = 0;
  for (const item of records(payload, "contexts")) {
    const id = stringValue(item.id);
    const label = stringValue(item.label);
    if (!id || !label) continue;
    await prisma.portfolioContextVersion.upsert({
      where: { id },
      update: {
        label,
        generatedMarkdown: optionalString(item.generatedMarkdown),
        manualMarkdown: optionalString(item.manualMarkdown),
        finalMarkdown: stringValue(item.finalMarkdown),
        isActive: booleanValue(item.isActive),
      },
      create: {
        id,
        label,
        generatedMarkdown: optionalString(item.generatedMarkdown),
        manualMarkdown: optionalString(item.manualMarkdown),
        finalMarkdown: stringValue(item.finalMarkdown),
        isActive: booleanValue(item.isActive),
        createdAt: dateValue(item.createdAt),
      },
    });
    count++;
  }
  return count;
}

async function runImport(payload: BackupPayload) {
  const media = await importMedia(payload);
  const categories = await importCategories(payload);
  const theme = await importTheme(payload);
  const simple = await importSimpleTables(payload);
  const certifications = await importCertifications(payload);
  const projects = await importProjects(payload);
  const experiences = await importExperiences(payload);
  const pages = await importPages(payload);
  const articles = await importArticles(payload);
  const contexts = await importContexts(payload);

  return {
    media,
    categories,
    theme,
    systems: simple.systems,
    contacts: simple.contacts,
    resumes: simple.resumes,
    music: simple.music,
    certifications,
    projects,
    experiences,
    pages,
    articles,
    contexts,
  };
}

export async function importRoutes(app: FastifyInstance) {
  app.post("/api/admin/import/preview", { preHandler: app.requireAdmin }, async (request, reply) => {
    try {
      const payload = await readBackupPayload(request);
      return { data: summarizeBackup(payload) };
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Invalid backup file." });
    }
  });

  app.post("/api/admin/import", { preHandler: app.requireAdmin }, async (request, reply) => {
    try {
      const payload = await readBackupPayload(request);
      const preview = summarizeBackup(payload);
      const imported = await runImport(payload);
      await writeAuditLog(request, {
        action: "import",
        entityType: "cms-backup",
        entityLabel: `backup exported ${preview.exportedAt}`,
        metadata: { imported, backupCounts: preview.counts },
      });
      return { data: { ...preview, imported } };
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "Failed to import backup." });
    }
  });
}
