import { Prisma, PrismaClient } from "@prisma/client";
import { siteContentPages } from "../../../src/data/siteContent.js";

const prisma = new PrismaClient();
const shouldOverwriteCms = process.env.CMS_SEED_OVERWRITE === "true";

function inputJson(value?: Record<string, unknown>) {
  return value ? (value as Prisma.InputJsonObject) : Prisma.JsonNull;
}

function jsonObject(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function defaultAnchorId(sectionKey: string) {
  const anchors: Record<string, string> = {
    "early-story": "story",
    values: "core-values",
  };

  return anchors[sectionKey] ?? sectionKey;
}

function mergedSettings(sectionKey: string, currentValue: Prisma.JsonValue | null, defaultValue?: Record<string, unknown>) {
  const current = jsonObject(currentValue);
  const merged = { anchorId: defaultAnchorId(sectionKey), ...defaultValue, ...current };

  if (sectionKey === "hero" && (!current.anchorId || current.identityCtaHref === "/#identity")) {
    merged.anchorId = defaultAnchorId(sectionKey);
  }

  if (sectionKey === "hero" && defaultValue && current.identityCtaHref === "/#identity") {
    merged.identityCtaHref = defaultValue.identityCtaHref;
  }

  return Object.keys(merged).some((key) => merged[key] !== current[key]) ? merged : null;
}

function seedSettings(sectionKey: string, defaultValue?: Record<string, unknown>) {
  return { anchorId: defaultAnchorId(sectionKey), ...defaultValue };
}

function nonOverwriteSectionUpdate(section: { sortOrder: number; isPublished?: boolean }) {
  return {
    sortOrder: section.sortOrder,
    ...(section.isPublished === false ? { isPublished: false } : {}),
  };
}

async function seedCms() {
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
        update: shouldOverwriteCms
          ? {
            title: section.title ?? null,
            subtitle: section.subtitle ?? null,
            body: section.body ?? null,
            settingsJson: inputJson(seedSettings(section.key, section.settingsJson)),
            sortOrder: section.sortOrder,
            isPublished: section.isPublished ?? true,
          }
          : nonOverwriteSectionUpdate(section),
        create: {
          pageId: savedPage.id,
          key: section.key,
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          body: section.body ?? null,
          settingsJson: inputJson(seedSettings(section.key, section.settingsJson)),
          sortOrder: section.sortOrder,
          isPublished: section.isPublished ?? true,
        },
      });

      if (!shouldOverwriteCms) {
        const settings = mergedSettings(section.key, savedSection.settingsJson, section.settingsJson);
        if (settings) {
          await prisma.siteSection.update({
            where: { id: savedSection.id },
            data: { settingsJson: inputJson(settings) },
          });
        }
      }

      const existingBlockCount = await prisma.contentBlock.count({ where: { sectionId: savedSection.id } });
      if (existingBlockCount === 0 && section.blocks && section.blocks.length > 0) {
        await prisma.contentBlock.createMany({
          data: section.blocks.map((block) => ({
            sectionId: savedSection.id,
            type: block.type,
            contentJson: inputJson(block.contentJson),
            sortOrder: block.sortOrder,
            isPublished: block.isPublished ?? true,
          })),
        });
      }
    }
  }
}

seedCms()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
