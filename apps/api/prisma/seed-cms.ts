import { PrismaClient } from "@prisma/client";
import { siteContentPages } from "../../../src/data/siteContent.js";

const prisma = new PrismaClient();

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
      await prisma.siteSection.upsert({
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
