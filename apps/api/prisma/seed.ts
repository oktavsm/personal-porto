import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "../src/plugins/auth.js";
import { certifications } from "../../../src/data/certifications.js";
import { experiences } from "../../../src/data/experiences.js";
import { media } from "../../../src/data/media.js";
import { projects } from "../../../src/data/projects.js";
import { siteContentPages } from "../../../src/data/siteContent.js";

const prisma = new PrismaClient();

const uploadDir = process.env.UPLOAD_DIR ? (process.env.UPLOAD_DIR.startsWith("/") ? process.env.UPLOAD_DIR : resolve(process.cwd(), process.env.UPLOAD_DIR)) : resolve(process.cwd(), "uploads");
const publicUploadBaseUrl = (process.env.PUBLIC_UPLOAD_BASE_URL ?? "/uploads").replace(/\/$/, "");

const mimeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

const liveSystems = [
  {
    slug: "titipin",
    title: "Titipin",
    description: "A deployed jastip and preloved platform. Embedded when iframe settings allow it.",
    url: "https://titipin.me",
    embedUrl: "https://titipin.me",
    sortOrder: 1,
  },
  {
    slug: "oktaavsm-dev-playground",
    title: "Oktaavsm Dev Playground",
    description: "A living playground for APIs, AI daily content, Spotify status, and experiments.",
    url: "https://oktaavsm.bccdev.id",
    embedUrl: "https://oktaavsm.bccdev.id",
    sortOrder: 2,
  },
];

const musicTracks = [
  {
    title: "Evaluasi (Reprise)",
    artist: "Hindia",
    note: "Raw, simple, and close. A song that gives room to pause without feeling like I have stopped trying.",
    audio: media.music.evaluasi,
    cover: media.music.evaluasiCover,
    sortOrder: 1,
  },
  {
    title: "everything u are",
    artist: "Hindia",
    note: "A warmer kind of acceptance. It reminds me that being unfinished and tired is still human.",
    audio: media.music.everything,
    cover: media.music.everythingCover,
    sortOrder: 2,
  },
];

function sourceUrlToPath(sourceUrl: string) {
  if (sourceUrl.startsWith("file://")) return fileURLToPath(sourceUrl);
  return sourceUrl;
}

function safeSeedFilename(originalName: string) {
  const extension = extname(originalName).toLowerCase();
  const stem = basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `seed-${stem || randomUUID()}${extension}`;
}

async function ensureSeedMedia(sourceUrl: string, caption?: string) {
  const sourcePath = sourceUrlToPath(sourceUrl);
  const originalName = basename(sourcePath);
  const filename = safeSeedFilename(originalName);
  const storagePath = join(uploadDir, filename);
  const extension = extname(originalName).toLowerCase();
  const mimeType = mimeByExtension[extension] ?? "application/octet-stream";

  await mkdir(uploadDir, { recursive: true });

  const existing = await prisma.mediaAsset.findFirst({
    where: { filename },
  });

  if (existing) return existing;

  await copyFile(sourcePath, storagePath);
  const info = await stat(storagePath);

  return prisma.mediaAsset.create({
    data: {
      filename,
      originalName,
      mimeType,
      sizeBytes: info.size,
      storagePath,
      publicUrl: `${publicUploadBaseUrl}/${encodeURIComponent(filename)}`,
      caption: caption ?? null,
    },
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: {},
      create: {
        email: adminEmail.toLowerCase(),
        passwordHash: await hashPassword(adminPassword),
        name: "Oktavianus Samuel",
      },
    });
  }

  for (const page of siteContentPages) {
    const savedPage = await prisma.sitePage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        description: page.description ?? null,
      },
      create: {
        slug: page.slug,
        title: page.title,
        description: page.description ?? null,
      },
    });

    for (const section of page.sections) {
      const savedSection = await prisma.siteSection.upsert({
        where: { pageId_key: { pageId: savedPage.id, key: section.key } },
        update: {
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          body: section.body ?? null,
          sortOrder: section.sortOrder,
          isPublished: section.isPublished ?? true,
        },
        create: {
          pageId: savedPage.id,
          key: section.key,
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          body: section.body ?? null,
          sortOrder: section.sortOrder,
          isPublished: section.isPublished ?? true,
        },
      });

      const existingBlockCount = await prisma.contentBlock.count({ where: { sectionId: savedSection.id } });
      if (existingBlockCount === 0 && section.blocks && section.blocks.length > 0) {
        await prisma.contentBlock.createMany({
          data: section.blocks.map((block) => ({
            sectionId: savedSection.id,
            type: block.type,
            contentJson: block.contentJson,
            sortOrder: block.sortOrder,
            isPublished: block.isPublished ?? true,
          })),
        });
      }
    }
  }

  for (const [index, certification] of certifications.entries()) {
    const existing = await prisma.certification.findFirst({ where: { title: certification.title } });
    const data = {
      issuer: certification.issuer,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt ?? null,
      credentialUrl: certification.credentialUrl,
      isFeatured: certification.featured ?? false,
      sortOrder: index + 1,
    };

    const saved = existing
      ? await prisma.certification.update({ where: { id: existing.id }, data })
      : await prisma.certification.create({ data: { title: certification.title, ...data } });

    await prisma.certificationSkill.deleteMany({ where: { certificationId: saved.id } });
    await prisma.certificationSkill.createMany({
      data: certification.skills.map((label, sortOrder) => ({
        certificationId: saved.id,
        label,
        sortOrder,
      })),
    });
  }

  for (const [index, project] of projects.entries()) {
    const saved = await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        title: project.title,
        ecosystem: project.ecosystem ?? null,
        category: project.category,
        priority: project.priority,
        summary: project.summary,
        problem: project.problem,
        solution: project.solution,
        status: project.status,
        isFeatured: project.priority !== "Archive",
        isPublished: true,
        sortOrder: index + 1,
      },
      create: {
        slug: project.slug,
        title: project.title,
        ecosystem: project.ecosystem ?? null,
        category: project.category,
        priority: project.priority,
        summary: project.summary,
        problem: project.problem,
        solution: project.solution,
        status: project.status,
        isFeatured: project.priority !== "Archive",
        isPublished: true,
        sortOrder: index + 1,
      },
    });

    await prisma.projectRole.deleteMany({ where: { projectId: saved.id } });
    await prisma.projectTechStack.deleteMany({ where: { projectId: saved.id } });
    await prisma.projectLearning.deleteMany({ where: { projectId: saved.id } });
    await prisma.projectLink.deleteMany({ where: { projectId: saved.id } });

    await prisma.projectRole.createMany({
      data: project.role.map((label, sortOrder) => ({ projectId: saved.id, label, sortOrder })),
    });
    await prisma.projectTechStack.createMany({
      data: project.techStack.map((label, sortOrder) => ({ projectId: saved.id, label, sortOrder })),
    });
    await prisma.projectLearning.createMany({
      data: project.learnings.map((text, sortOrder) => ({ projectId: saved.id, text, sortOrder })),
    });

    const links = [
      project.links.demo ? { type: "demo", label: "Live Demo", url: project.links.demo, sortOrder: 0 } : null,
      project.links.github ? { type: "github", label: "Source Code", url: project.links.github, sortOrder: 1 } : null,
      project.links.download ? { type: "download", label: "Download", url: project.links.download, sortOrder: 2 } : null,
    ].filter((link): link is { type: string; label: string; url: string; sortOrder: number } => Boolean(link));

    if (links.length > 0) {
      await prisma.projectLink.createMany({
        data: links.map((link) => ({ projectId: saved.id, ...link })),
      });
    }

    const existingProjectMediaCount = await prisma.projectMedia.count({ where: { projectId: saved.id } });
    if (existingProjectMediaCount === 0) {
      for (const [mediaIndex, image] of project.images.entries()) {
        const asset = await ensureSeedMedia(image, `${project.title} screenshot`);
        await prisma.projectMedia.create({
          data: {
            projectId: saved.id,
            mediaAssetId: asset.id,
            kind: mediaIndex === 0 ? "cover" : "gallery",
            sortOrder: mediaIndex,
          },
        });
      }
    }
  }

  for (const [index, experience] of experiences.entries()) {
    const saved = await prisma.experience.upsert({
      where: { slug: experience.slug },
      update: {
        title: experience.title,
        organization: experience.organization,
        period: experience.period,
        category: experience.category,
        summary: experience.summary,
        reflection: experience.reflection,
        isFeatured: index < 6,
        isPublished: true,
        sortOrder: index + 1,
      },
      create: {
        slug: experience.slug,
        title: experience.title,
        organization: experience.organization,
        period: experience.period,
        category: experience.category,
        summary: experience.summary,
        reflection: experience.reflection,
        isFeatured: index < 6,
        isPublished: true,
        sortOrder: index + 1,
      },
    });

    await prisma.experienceResponsibility.deleteMany({ where: { experienceId: saved.id } });
    await prisma.experienceImpact.deleteMany({ where: { experienceId: saved.id } });
    await prisma.experienceValue.deleteMany({ where: { experienceId: saved.id } });

    await prisma.experienceResponsibility.createMany({
      data: experience.responsibilities.map((text, sortOrder) => ({ experienceId: saved.id, text, sortOrder })),
    });
    await prisma.experienceImpact.createMany({
      data: experience.impact.map((text, sortOrder) => ({ experienceId: saved.id, text, sortOrder })),
    });
    await prisma.experienceValue.createMany({
      data: experience.values.map((label, sortOrder) => ({ experienceId: saved.id, label, sortOrder })),
    });

    const existingExperienceMediaCount = await prisma.experienceMedia.count({ where: { experienceId: saved.id } });
    if (experience.image && existingExperienceMediaCount === 0) {
      const asset = await ensureSeedMedia(experience.image, `${experience.title} documentation`);
      await prisma.experienceMedia.create({
        data: {
          experienceId: saved.id,
          mediaAssetId: asset.id,
          kind: "cover",
          sortOrder: 0,
        },
      });
    }
  }

  for (const system of liveSystems) {
    await prisma.liveSystem.upsert({
      where: { slug: system.slug },
      update: system,
      create: system,
    });
  }

  const contactLinks = [
    { type: "email", label: "Email", value: "oktaavsm@student.ub.ac.id", url: "mailto:oktaavsm@student.ub.ac.id", isPrimary: true, sortOrder: 1 },
    { type: "github", label: "GitHub", url: "https://github.com/oktavsm", sortOrder: 2 },
    { type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/oktaavsm/", sortOrder: 3 },
    { type: "instagram", label: "Instagram", url: "https://instagram.com/oktaavsm", sortOrder: 4 },
  ];

  for (const link of contactLinks) {
    const existing = await prisma.contactLink.findFirst({ where: { type: link.type, url: link.url } });
    if (existing) {
      await prisma.contactLink.update({ where: { id: existing.id }, data: link });
    } else {
      await prisma.contactLink.create({ data: link });
    }
  }

  for (const track of musicTracks) {
    const audioAsset = await ensureSeedMedia(track.audio, `${track.title} audio`);
    const coverAsset = await ensureSeedMedia(track.cover, `${track.title} cover`);
    const existing = await prisma.musicTrack.findFirst({
      where: { title: track.title, artist: track.artist },
    });

    const data = {
      artist: track.artist,
      audioAssetId: audioAsset.id,
      coverAssetId: coverAsset.id,
      note: track.note,
      isActive: true,
      sortOrder: track.sortOrder,
    };

    if (existing) {
      await prisma.musicTrack.update({ where: { id: existing.id }, data });
    } else {
      await prisma.musicTrack.create({ data: { title: track.title, ...data } });
    }
  }

  const resumeAsset = await ensureSeedMedia(media.cv, "CV Oktavianus Samuel Minarto");
  const existingSeedResume = await prisma.resumeVersion.findFirst({
    where: { label: "CV Static Seed" },
  });
  const activeResume = await prisma.resumeVersion.findFirst({
    where: {
      isActive: true,
      mediaAssetId: { not: null },
    },
  });
  const resumeData = {
    mediaAssetId: resumeAsset.id,
    isActive: !activeResume || activeResume.id === existingSeedResume?.id,
    notes: "Seeded from bundled portfolio assets.",
  };

  if (existingSeedResume) {
    await prisma.resumeVersion.update({
      where: { id: existingSeedResume.id },
      data: resumeData,
    });
  } else {
    await prisma.resumeVersion.create({
      data: {
        label: "CV Static Seed",
        ...resumeData,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
