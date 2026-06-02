import { siteContentPages, type SiteContentBlock, type SiteContentSection } from "../data/siteContent";
import type { PublicSiteBlock, PublicSitePage, PublicSiteSection } from "./publicApi";

export type EditableBlock = Pick<SiteContentBlock, "type" | "sortOrder"> & {
  id?: string;
  contentJson: Record<string, unknown>;
  isPublished?: boolean;
};

export type EditableSection = Pick<SiteContentSection, "key" | "title" | "subtitle" | "body" | "sortOrder"> & {
  isPublished?: boolean;
  blocks?: EditableBlock[];
  settingsJson?: Record<string, unknown>;
};

export type CardBlock = {
  title: string;
  text: string;
  imageKey?: string;
  imageUrl?: string;
  mediaAssetId?: string;
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

export function sectionSettings(sections: Map<string, EditableSection>, key: string) {
  return sectionCopy(sections, key).settingsJson ?? {};
}

export function settingString(settings: Record<string, unknown>, key: string, fallback = "") {
  const value = settings[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function settingImage(settings: Record<string, unknown>, imageMap: Record<string, string>, fallback: string) {
  const imageUrl = settingString(settings, "imageUrl");
  if (imageUrl) return imageUrl;
  const imageKey = settingString(settings, "imageKey");
  return imageKey ? imageMap[imageKey] ?? fallback : fallback;
}

export function bodyParagraphs(body?: string | null) {
  return (body ?? "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function cardBlocks(sections: Map<string, EditableSection>, key: string, fallback: CardBlock[]) {
  const blocks = sectionCopy(sections, key).blocks ?? [];
  const cards = blocks
    .filter((block) => block.type === "card" && block.isPublished !== false)
    .map((block) => normalizeCardBlock(block.contentJson))
    .filter((card): card is CardBlock => Boolean(card));

  return cards.length > 0 ? cards : fallback;
}

function normalizePublicSection(section: PublicSiteSection): EditableSection {
  return {
    key: section.key,
    title: section.title ?? undefined,
    subtitle: section.subtitle ?? undefined,
    body: section.body ?? undefined,
    sortOrder: section.sortOrder,
    isPublished: section.isPublished,
    settingsJson: normalizeObject(section.settingsJson),
    blocks: section.blocks.map(normalizePublicBlock),
  };
}

function normalizePublicBlock(block: PublicSiteBlock): EditableBlock {
  return {
    id: block.id,
    type: block.type,
    contentJson: normalizeObject(block.contentJson),
    sortOrder: block.sortOrder,
    isPublished: block.isPublished,
  };
}

function normalizeCardBlock(value: Record<string, unknown>): CardBlock | null {
  const title = typeof value.title === "string" ? value.title : "";
  const text = typeof value.text === "string" ? value.text : "";
  const imageKey = typeof value.imageKey === "string" ? value.imageKey : undefined;
  const imageUrl = typeof value.imageUrl === "string" ? value.imageUrl : undefined;
  const mediaAssetId = typeof value.mediaAssetId === "string" ? value.mediaAssetId : undefined;
  if (!title && !text) return null;
  return { title, text, imageKey, imageUrl, mediaAssetId };
}

function normalizeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
