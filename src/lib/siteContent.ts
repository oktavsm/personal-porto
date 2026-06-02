import { siteContentPages, type SiteContentSection } from "../data/siteContent";
import type { PublicSitePage, PublicSiteSection } from "./publicApi";

export type EditableSection = Pick<SiteContentSection, "key" | "title" | "subtitle" | "body" | "sortOrder"> & {
  isPublished?: boolean;
};

export function resolveSections(slug: string, page?: PublicSitePage | null) {
  const fallback = siteContentPages.find((item) => item.slug === slug);
  const sections = new Map<string, EditableSection>();

  for (const section of fallback?.sections ?? []) {
    sections.set(section.key, section);
  }

  for (const section of page?.sections ?? []) {
    sections.set(section.key, normalizePublicSection(section));
  }

  return sections;
}

export function sectionCopy(sections: Map<string, EditableSection>, key: string) {
  return sections.get(key) ?? { key, sortOrder: 0 };
}

export function bodyParagraphs(body?: string | null) {
  return (body ?? "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function normalizePublicSection(section: PublicSiteSection): EditableSection {
  return {
    key: section.key,
    title: section.title ?? undefined,
    subtitle: section.subtitle ?? undefined,
    body: section.body ?? undefined,
    sortOrder: section.sortOrder,
    isPublished: section.isPublished,
  };
}
