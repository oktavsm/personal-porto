import { Prisma, PrismaClient } from "@prisma/client";
import { siteContentPages } from "../../../src/data/siteContent.js";

const prisma = new PrismaClient();

function inputJson(value?: Record<string, unknown>) {
  return value ? (value as Prisma.InputJsonObject) : Prisma.JsonNull;
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
        update: {
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          body: section.body ?? null,
          settingsJson: inputJson(section.settingsJson),
          sortOrder: section.sortOrder,
          isPublished: section.isPublished ?? true,
        },
        create: {
          pageId: savedPage.id,
          key: section.key,
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          body: section.body ?? null,
          settingsJson: inputJson(section.settingsJson),
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
