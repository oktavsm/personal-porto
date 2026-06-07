import { ArrowDown, ArrowUp, BookOpen, Check, CheckCircle, ChevronDown, Copy, Download, ExternalLink, FileText, GripVertical, History, KeyRound, LogOut, Palette, Pencil, Plus, RefreshCw, ShieldCheck, Sparkles, Star, Trash2, Upload, X } from "lucide-react";
import { DragEvent, FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  adminApi,
  type AdminAuditLog,
  type AdminArticle,
  type AdminArticleBlock,
  type AdminBackupSummary,
  type AdminCertification,
  type AdminContactLink,
  type AdminContexts,
  type AdminContextKind,
  type AdminContentCategory,
  type AdminCoreServerNode,
  type AdminExperience,
  type AdminLiveSystem,
  type AdminMediaAsset,
  type AdminMusicTrack,
  type AdminProject,
  type AdminResumeVersion,
  type AdminSiteBlock,
  type AdminSitePage,
  type AdminSiteSection,
  type AdminTheme,
  type AdminUser,
  type ContentCategoryScope,
} from "../../lib/adminApi";
import { ArticleContent } from "../../components/articles/ArticleContent";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { PublicArticleBlock } from "../../lib/publicApi";

type AdminState = {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
};

type DeleteTarget =
  | { type: "certification"; id: string; label: string }
  | { type: "system"; id: string; label: string }
  | { type: "contact"; id: string; label: string }
  | { type: "media"; id: string; label: string }
  | { type: "project"; id: string; label: string }
  | { type: "experience"; id: string; label: string }
  | { type: "music"; id: string; label: string }
  | { type: "article"; id: string; label: string }
  | { type: "category"; id: string; label: string }
  | { type: "coreNode"; id: string; label: string }
  | { type: "pageBlock"; id: string; label: string; pageSlug: string; sectionKey: string };

type AdminTab = "overview" | "projects" | "experiences" | "music" | "resume-media" | "certifications" | "systems" | "core-nodes" | "contacts" | "categories" | "pages" | "articles" | "contexts" | "theme" | "security" | "audit";
type MediaPickerTarget = "projectGallery" | "experienceGallery" | "pageBlockImage" | "pageSectionImage" | "articleCover";
type ArticlePreviewMode = "reader" | "desktop" | "mobile";

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "experiences", label: "Experiences" },
  { id: "music", label: "Music" },
  { id: "resume-media", label: "Resume & Media" },
  { id: "certifications", label: "Certifications" },
  { id: "systems", label: "Systems" },
  { id: "core-nodes", label: "Core Nodes" },
  { id: "contacts", label: "Contacts" },
  { id: "categories", label: "Categories" },
  { id: "pages", label: "Pages" },
  { id: "articles", label: "Articles" },
  { id: "contexts", label: "Contexts" },
  { id: "theme", label: "Theme" },
  { id: "security", label: "Security" },
  { id: "audit", label: "Audit" },
];

const articleBlockTypes = ["paragraph", "heading", "image", "gallery", "quote", "callout", "list", "code", "divider"];

const emptyCertification = {
  title: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  credentialUrl: "",
  skills: "",
  isFeatured: false,
  sortOrder: 0,
};

const emptySystem = {
  title: "",
  description: "",
  url: "",
  embedUrl: "",
  isEmbeddable: true,
  isPublished: true,
  sortOrder: 0,
};

const emptyCoreNode = {
  label: "",
  description: "",
  href: "",
  positionX: 50,
  positionY: 50,
  sortOrder: 0,
  isPublished: true,
};

const emptyContact = {
  type: "email",
  label: "",
  value: "",
  url: "",
  isPrimary: false,
  sortOrder: 0,
};

const emptyCategory = {
  scope: "article" as ContentCategoryScope,
  label: "",
  slug: "",
  description: "",
  isActive: true,
  sortOrder: 0,
};

const emptySecurityForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyResumeForm = {
  label: "",
  notes: "",
};

const emptyProject = {
  title: "",
  slug: "",
  ecosystem: "",
  category: "Web",
  priority: "Featured",
  summary: "",
  problem: "",
  solution: "",
  status: "In Development",
  roles: "",
  techStack: "",
  learnings: "",
  demoUrl: "",
  githubUrl: "",
  downloadUrl: "",
  coverMediaAssetId: "",
  galleryMediaAssetIds: [] as string[],
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

const emptyExperience = {
  title: "",
  slug: "",
  organization: "",
  period: "",
  category: "Community",
  summary: "",
  responsibilities: "",
  impact: "",
  reflection: "",
  values: "",
  coverMediaAssetId: "",
  galleryMediaAssetIds: [] as string[],
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

const emptyMusic = {
  title: "",
  artist: "",
  note: "",
  audioAssetId: "",
  coverAssetId: "",
  isActive: true,
  sortOrder: 0,
};

const emptyPageSection = {
  key: "",
  title: "",
  subtitle: "",
  body: "",
  titleAlign: "left",
  bodyAlign: "left",
  imageKey: "",
  mediaAssetId: "",
  imageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  primaryCtaLabel: "",
  primaryCtaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  tertiaryCtaLabel: "",
  tertiaryCtaHref: "",
  sortOrder: 0,
  isPublished: true,
};

const emptyPageBlock = {
  title: "",
  text: "",
  imageKey: "",
  mediaAssetId: "",
  imageUrl: "",
  sortOrder: 0,
  isPublished: true,
};

const fallbackProjectCategories = ["Android", "Web", "Automation", "AI", "Networking", "Academic", "Utility"];
const fallbackExperienceCategories = ["Leadership", "Teaching", "Scholarship", "Service", "Community", "Technical"];
const fallbackArticleCategories = [
  "Reflection", "Workshop", "Project Log", "Learning Note",
  "TELADAN Journey", "Event Story", "Technical Note", "Personal Essay",
];
const categoryScopeOptions: { value: ContentCategoryScope; label: string }[] = [
  { value: "article", label: "Articles" },
  { value: "project", label: "Projects" },
  { value: "experience", label: "Experiences" },
];
const projectPriorityOptions = ["Flagship", "Featured", "Archive"].map((value) => ({ value, label: value }));
const projectStatusOptions = ["Deployed", "In Development", "Prototype", "Paused", "Archived"].map((value) => ({ value, label: value }));
const contactTypeOptions = [
  { value: "email", label: "Email" },
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "custom", label: "Custom" },
];

const articleStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "generated", label: "Generated (AI)" },
  { value: "review", label: "In Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const textAlignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

const fontStackOptions = [
  { value: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", label: "Inter / Clean System" },
  { value: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", label: "Native System" },
  { value: "Georgia, \"Times New Roman\", serif", label: "Editorial Serif" },
  { value: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace", label: "Technical Mono" },
];

const monoFontStackOptions = [
  { value: "\"JetBrains Mono\", \"SFMono-Regular\", Consolas, monospace", label: "JetBrains Mono" },
  { value: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace", label: "System Mono" },
  { value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", monospace", label: "UI Monospace" },
];

const themeColorKeys = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "surfaceSoft", label: "Surface Soft" },
  { key: "card", label: "Card" },
  { key: "cardHover", label: "Card Hover" },
  { key: "border", label: "Border" },
  { key: "textPrimary", label: "Text Primary" },
  { key: "textSecondary", label: "Text Secondary" },
  { key: "textMuted", label: "Text Muted" },
  { key: "accent", label: "Accent" },
  { key: "accentSoft", label: "Accent Soft" },
  { key: "accentDim", label: "Accent Dim" },
];

const themeVarMap: Record<string, string> = {
  background: "--bg",
  surface: "--surface",
  surfaceSoft: "--bg-2",
  card: "--card",
  cardHover: "--card-2",
  border: "--border",
  textPrimary: "--text",
  textSecondary: "--muted",
  textMuted: "--muted-2",
  accent: "--accent",
  accentSoft: "--accent-soft",
  accentDim: "--accent-dim",
  fontScale: "--font-scale",
  bodyFont: "--font-body",
  headingFont: "--font-heading",
  monoFont: "--font-mono",
  articleAlign: "--article-align",
  articleWidth: "--article-width",
  sectionSpacing: "--section-space",
  cardRadius: "--card-radius",
  buttonRadius: "--button-radius",
  heroGlowOpacity: "--hero-glow-opacity",
  heroGlowPosition: "--hero-glow-pos",
};

const themeControlKeys = [
  { key: "fontScale", label: "Font Scale", options: [
    { value: "0.95", label: "Compact" },
    { value: "1", label: "Default" },
    { value: "1.08", label: "Readable" },
  ] },
  { key: "bodyFont", label: "Body Font", options: fontStackOptions },
  { key: "headingFont", label: "Heading Font", options: fontStackOptions },
  { key: "monoFont", label: "Code Font", options: monoFontStackOptions },
  { key: "articleAlign", label: "Article Text Align", options: textAlignOptions },
  { key: "articleWidth", label: "Article Width", options: [
    { value: "680px", label: "Focused" },
    { value: "720px", label: "Default" },
    { value: "860px", label: "Wide" },
  ] },
  { key: "sectionSpacing", label: "Section Spacing", options: [
    { value: "64px", label: "Compact" },
    { value: "96px", label: "Default" },
    { value: "120px", label: "Spacious" },
  ] },
  { key: "cardRadius", label: "Card Radius", options: [
    { value: "12px", label: "Sharp" },
    { value: "18px", label: "Default" },
    { value: "26px", label: "Soft" },
  ] },
  { key: "buttonRadius", label: "Button Radius", options: [
    { value: "12px", label: "Soft Rectangle" },
    { value: "24px", label: "Rounded" },
    { value: "999px", label: "Pill" },
  ] },
  { key: "heroGlowOpacity", label: "Hero Glow Intensity", options: [
    { value: "0", label: "Off (Dark — default)" },
    { value: "0.18", label: "Subtle" },
    { value: "0.42", label: "Moderate" },
    { value: "0.72", label: "Strong" },
    { value: "1", label: "Full" },
  ] },
  { key: "heroGlowPosition", label: "Hero Glow Position", options: [
    { value: "-20%", label: "Above viewport" },
    { value: "-12%", label: "Near top (default)" },
    { value: "0%", label: "Top edge" },
    { value: "15%", label: "Upper quarter" },
    { value: "30%", label: "Mid-upper" },
  ] },
];

const themePresets: { label: string; values: Record<string, string> }[] = [
  { label: "Default", values: {} },
  {
    label: "Tighter Reading",
    values: {
      fontScale: "0.95",
      bodyFont: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      headingFont: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      articleWidth: "680px",
      sectionSpacing: "64px",
      cardRadius: "12px",
    },
  },
  {
    label: "Wide Article",
    values: {
      fontScale: "1.08",
      bodyFont: "Georgia, \"Times New Roman\", serif",
      headingFont: "Georgia, \"Times New Roman\", serif",
      articleWidth: "860px",
      sectionSpacing: "96px",
      cardRadius: "18px",
    },
  },
];

const emptyArticleForm = {
  title: "",
  slug: "",
  subtitle: "",
  excerpt: "",
  category: "Reflection",
  status: "draft",
  isFeatured: false,
  coverAssetId: "",
  seoTitle: "",
  seoDescription: "",
  generatorMeta: null as unknown,
  authorName: "Oktavianus Samuel",
  authorRole: "",
  tags: "",
};

const emptyArticleGeneratorForm = {
  topic: "",
  rawNotes: "",
  category: "Reflection",
  tone: "reflective, grounded, personal, professional",
  language: "English",
  targetLength: "medium",
  sourceContext: "",
  articleContext: "",
  mediaAssetIds: [] as string[],
  mediaContext: {} as Record<string, string>,
};

const emptyContextForm: Record<AdminContextKind, string> = {
  portfolio: "",
  article: "",
};

const emptyContextMode: Record<AdminContextKind, "append" | "override"> = {
  portfolio: "append",
  article: "append",
};

type ArticleBlockDraft = {
  id: string; // local only for dnd key
  type: string;
  contentJson: Record<string, unknown>;
};

type ArticleGeneratorForm = typeof emptyArticleGeneratorForm;
type ArticleEditorForm = typeof emptyArticleForm;

type ArticleLocalDraft = {
  editingArticleId: string | null;
  articleForm: ArticleEditorForm;
  articleBlocks: ArticleBlockDraft[];
  savedAt: string;
};

const articleAutosaveKey = "teladan_article_editor_autosave";

function hasArticleDraftContent(form: ArticleEditorForm, blocks: ArticleBlockDraft[]) {
  return Boolean(
    form.title.trim()
    || form.slug.trim()
    || form.subtitle.trim()
    || form.excerpt.trim()
    || form.tags.trim()
    || blocks.length > 0,
  );
}

function articleDraftTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function articleDraftPlainText(block: ArticleBlockDraft) {
  const content = block.contentJson && typeof block.contentJson === "object" && !Array.isArray(block.contentJson)
    ? block.contentJson as Record<string, unknown>
    : {};

  if (block.type === "list" && Array.isArray(content.items)) {
    return content.items.filter((item): item is string => typeof item === "string").join(" ");
  }

  if (block.type === "code") return String(content.code ?? "");
  if (block.type === "heading" || block.type === "paragraph" || block.type === "quote" || block.type === "callout") {
    return [content.title, content.text, content.source].filter((item) => typeof item === "string").join(" ");
  }

  return "";
}

function estimateArticleReadingTime(form: ArticleEditorForm, blocks: ArticleBlockDraft[]) {
  const text = [
    form.title,
    form.subtitle,
    form.excerpt,
    ...blocks.map(articleDraftPlainText),
  ].join(" ");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

function publicArticleBlocksFromDraft(blocks: ArticleBlockDraft[]): PublicArticleBlock[] {
  return blocks.map((block, index) => ({
    id: block.id || `preview-block-${index}`,
    type: block.type,
    contentJson: block.contentJson,
    sortOrder: index,
  }));
}

function serializeArticleDraftPayload(draft: Omit<ArticleLocalDraft, "savedAt">) {
  return JSON.stringify(draft);
}

type AdminSelectOption = {
  value: string;
  label: string;
};

function optionsFromLabels(labels: string[]) {
  return labels.map((value) => ({ value, label: value }));
}

function categoryScopeLabel(scope: ContentCategoryScope) {
  return categoryScopeOptions.find((option) => option.value === scope)?.label ?? scope;
}

function categoryOptionsFor(
  categories: AdminContentCategory[],
  scope: ContentCategoryScope,
  fallbackLabels: string[],
  currentValue?: string,
) {
  const labels = [
    ...categories
      .filter((category) => category.scope === scope && category.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map((category) => category.label),
    ...fallbackLabels,
    ...(currentValue ? [currentValue] : []),
  ];

  return optionsFromLabels(Array.from(new Set(labels.filter(Boolean))));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatAuditDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function selectedFilesLabel(files: File[]) {
  if (files.length === 0) return "Choose file";
  if (files.length === 1) return files[0]?.name ?? "1 file selected";
  return `${files.length} files selected`;
}

function selectedFilesMeta(files: File[], placeholder: string) {
  if (files.length === 0) return placeholder;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (files.length === 1) return formatBytes(files[0]?.size ?? 0);
  return `${formatBytes(totalSize)} total`;
}

function applyThemeVariables(theme: AdminTheme) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(themeVarMap)) {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  }
}

function clearThemeVariables() {
  const root = document.documentElement;
  Object.values(themeVarMap).forEach((cssVar) => root.style.removeProperty(cssVar));
}

function moveId<T extends { id: string }>(items: T[], id: string, direction: "up" | "down") {
  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex < 0) return null;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return null;

  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(targetIndex, 0, item);
  return nextItems;
}

function matchesSearch(query: string, values: Array<string | number | boolean | null | undefined>) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}

function articleBlockLabel(block: ArticleBlockDraft) {
  const content = block.contentJson;
  switch (block.type) {
    case "heading":
      return `heading · H${Number(content.level || 2)}`;
    case "image":
      return `image · ${String(content.layout || "inline")}`;
    case "gallery": {
      const images = Array.isArray(content.images) ? content.images.length : 0;
      const suffix = images === 1 ? "image" : "images";
      return `gallery · ${String(content.layout || "grid")} · ${images} ${suffix}`;
    }
    case "callout":
      return `callout · ${String(content.variant || "note")}`;
    case "list":
      return `list · ${String(content.style || "bullet")}`;
    case "code":
      return content.language ? `code · ${String(content.language)}` : "code";
    default:
      return block.type;
  }
}

function articleBlockPreview(block: ArticleBlockDraft) {
  const content = block.contentJson;
  if (typeof content.text === "string" && content.text.trim()) return content.text.slice(0, 72);
  if (typeof content.caption === "string" && content.caption.trim()) return content.caption.slice(0, 72);
  if (typeof content.code === "string" && content.code.trim()) return content.code.slice(0, 72);
  if (Array.isArray(content.items) && content.items.length > 0) return content.items.slice(0, 2).map(String).join(", ");
  if (Array.isArray(content.images)) return `${content.images.length} selected media item${content.images.length === 1 ? "" : "s"}`;
  if (typeof content.src === "string" && content.src.trim()) return content.src;
  return `<${block.type}>`;
}

function articleBlockThumbnail(block: ArticleBlockDraft) {
  const content = block.contentJson;
  if (block.type === "image" && typeof content.src === "string" && content.src.trim()) {
    return content.src;
  }

  if (block.type === "gallery" && Array.isArray(content.images)) {
    const firstImage = content.images.find((image) => image && typeof image === "object" && "src" in image) as { src?: unknown } | undefined;
    return typeof firstImage?.src === "string" ? firstImage.src : "";
  }

  return "";
}

function generatorMetaPreview(value: unknown) {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function generatorMetaObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function generatorMetaText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function generatorMetaMedia(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

function GeneratorMetaPanel({ value }: { value: unknown }) {
  const meta = generatorMetaObject(value);
  if (!meta) return null;

  const media = generatorMetaMedia(meta.media);
  const rawNotes = generatorMetaText(meta.rawNotes);
  const sourceContext = generatorMetaText(meta.sourceContext);
  const articleContextOverride = generatorMetaText(meta.articleContextOverride);

  return (
    <details className="admin-generator-trace">
      <summary className="admin-seo-toggle">Generator source note</summary>
      <div className="admin-generator-trace-grid">
        <span><strong>Topic</strong>{generatorMetaText(meta.topic) || "Not provided"}</span>
        <span><strong>Length</strong>{generatorMetaText(meta.targetLength) || "medium"}</span>
        <span><strong>Language</strong>{generatorMetaText(meta.language) || "English"}</span>
        <span><strong>Tone</strong>{generatorMetaText(meta.tone) || "Default reflective tone"}</span>
      </div>
      {media.length > 0 ? (
        <div className="admin-generator-trace-section">
          <strong>Selected media</strong>
          <div className="admin-badge-list">
            {media.map((item, index) => (
              <span className="admin-badge is-muted" key={`${generatorMetaText(item.mediaAssetId) || index}`}>
                {generatorMetaText(item.originalName) || generatorMetaText(item.altText) || `Media ${index + 1}`}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {sourceContext ? (
        <div className="admin-generator-trace-section">
          <strong>Extra source context</strong>
          <p>{sourceContext}</p>
        </div>
      ) : null}
      {articleContextOverride ? (
        <div className="admin-generator-trace-section">
          <strong>Writing style override</strong>
          <p>{articleContextOverride}</p>
        </div>
      ) : null}
      {rawNotes ? (
        <div className="admin-generator-trace-section">
          <strong>Raw notes</strong>
          <p>{rawNotes}</p>
        </div>
      ) : null}
      <details className="admin-audit-details">
        <summary>Raw metadata</summary>
        <pre className="admin-context-preview">{generatorMetaPreview(value)}</pre>
      </details>
    </details>
  );
}

function DeleteConfirmModal({
  target,
  saving,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <div className="section-kicker">Confirm Delete</div>
        <h3 id="delete-dialog-title">Remove this item?</h3>
        <p>
          You are about to remove <strong>{target.label}</strong>. This action will update the public portfolio data.
        </p>
        <div className="actions">
          <button className="btn" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary danger-action" type="button" onClick={onConfirm} disabled={saving}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MediaSelectionPreview({
  asset,
  onClear,
}: {
  asset?: AdminMediaAsset;
  onClear: () => void;
}) {
  if (!asset) return null;

  return (
    <div className="admin-media-preview">
      {asset.mimeType.startsWith("image/") ? <img src={asset.publicUrl} alt={asset.originalName} /> : <FileText size={18} />}
      <span>{asset.originalName}</span>
      <button className="icon-btn" type="button" aria-label={`Clear ${asset.originalName}`} onClick={onClear}>
        <X size={14} />
      </button>
    </div>
  );
}

function GalleryMediaPickerModal({
  title,
  assets,
  selectedIds,
  multiple = true,
  saving,
  onCancel,
  onSave,
}: {
  title: string;
  assets: AdminMediaAsset[];
  selectedIds: string[];
  multiple?: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (selectedIds: string[]) => void;
}) {
  const [draftIds, setDraftIds] = useState(selectedIds);
  const [search, setSearch] = useState("");
  const filteredAssets = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return assets;
    return assets.filter((asset) => `${asset.originalName} ${asset.mimeType}`.toLowerCase().includes(query));
  }, [assets, search]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function toggleAsset(assetId: string) {
    setDraftIds((current) => {
      if (!multiple) return current.includes(assetId) ? [] : [assetId];
      return current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId];
    });
  }

  return createPortal(
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-media-picker-modal" role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
        <div className="admin-card-head">
          <div>
            <div className="section-kicker">Media Picker</div>
            <h3 id="media-picker-title">{title}</h3>
          </div>
          <button className="icon-btn" type="button" aria-label="Close media picker" onClick={onCancel} disabled={saving}>
            <X size={15} />
          </button>
        </div>
        <AdminListTools
          label="Search images"
          value={search}
          placeholder="Search uploaded gallery image"
          count={filteredAssets.length}
          total={assets.length}
          onChange={setSearch}
        />
        <div className="admin-media-picker-grid">
          {filteredAssets.map((asset) => {
            const selected = draftIds.includes(asset.id);
            return (
              <button
                className={`admin-media-picker-item${selected ? " is-selected" : ""}`}
                key={asset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAsset(asset.id)}
              >
                <span className="admin-media-picker-thumb">
                  <img src={asset.publicUrl} alt={asset.originalName} />
                  {selected ? (
                    <span className="admin-media-picker-check">
                      <Check size={16} />
                    </span>
                  ) : null}
                </span>
                <span>{asset.originalName}</span>
              </button>
            );
          })}
          {filteredAssets.length === 0 ? <p className="admin-empty">No image media matched this search.</p> : null}
        </div>
        <div className="admin-media-picker-footer">
          <span className="admin-help">{draftIds.length} selected</span>
          <div className="actions">
            <button className="btn" type="button" onClick={() => setDraftIds([])} disabled={saving || draftIds.length === 0}>
              Clear
            </button>
            <button className="btn" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={() => onSave(draftIds)} disabled={saving}>
              <Check size={16} /> Use Selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AdminSelect({
  label,
  value,
  options,
  placeholder = "Choose one",
  onChange,
}: {
  label: string;
  value: string;
  options: AdminSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <label className="admin-select-field">
      <span>{label}</span>
      <div className="admin-select" ref={rootRef}>
        <button
          className="admin-select-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={selectId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={selectedOption ? "admin-select-value" : "admin-select-value is-placeholder"}>{selectedOption?.label ?? placeholder}</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <div className="admin-select-menu" id={selectId} role="listbox" aria-label={label}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  className={`admin-select-option${selected ? " is-selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  key={`${label}-${option.value}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check size={15} /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function AdminListTools({
  label,
  value,
  placeholder,
  count,
  total,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  count: number;
  total: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="admin-list-tools">
      <label>
        <span>{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      <span className="admin-help">
        {count} of {total}
      </span>
    </div>
  );
}

function ArticleGeneratorModal({
  value,
  categories,
  imageAssets,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: ArticleGeneratorForm;
  categories: AdminSelectOption[];
  imageAssets: AdminMediaAsset[];
  saving: boolean;
  onChange: (value: ArticleGeneratorForm) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [mediaSearch, setMediaSearch] = useState("");
  const selectedAssets = imageAssets.filter((asset) => value.mediaAssetIds.includes(asset.id));
  const filteredAssets = useMemo(() => {
    const query = mediaSearch.toLowerCase().trim();
    if (!query) return imageAssets;
    return imageAssets.filter((asset) =>
      `${asset.originalName} ${asset.altText ?? ""} ${asset.caption ?? ""}`.toLowerCase().includes(query),
    );
  }, [imageAssets, mediaSearch]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function update(partial: Partial<ArticleGeneratorForm>) {
    onChange({ ...value, ...partial });
  }

  function toggleAsset(assetId: string) {
    const selected = value.mediaAssetIds.includes(assetId);
    const mediaAssetIds = selected
      ? value.mediaAssetIds.filter((id) => id !== assetId)
      : [...value.mediaAssetIds, assetId];
    const mediaContext = selected
      ? Object.fromEntries(Object.entries(value.mediaContext).filter(([id]) => id !== assetId))
      : value.mediaContext;
    update({ mediaAssetIds, mediaContext });
  }

  function updateMediaContext(assetId: string, context: string) {
    update({ mediaContext: { ...value.mediaContext, [assetId]: context } });
  }

  return createPortal(
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-generator-modal" role="dialog" aria-modal="true" aria-labelledby="article-generator-title">
        <div className="admin-card-head">
          <div>
            <div className="section-kicker">Article Generator</div>
            <h3 id="article-generator-title">Generate article draft</h3>
          </div>
          <button className="icon-btn" type="button" aria-label="Close article generator" onClick={onCancel} disabled={saving}>
            <X size={15} />
          </button>
        </div>

        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {saving ? (
            <div className="admin-generator-status">
              <RefreshCw size={15} />
              <span>
                <strong>Generating draft</strong>
                Sending your notes, length target, and selected media context to the article workflow.
              </span>
            </div>
          ) : null}

          <div className="admin-form-pair">
            <label>
              Topic
              <input
                value={value.topic}
                onChange={(event) => update({ topic: event.target.value })}
                placeholder="e.g. Wi-Fi camp reflection"
              />
            </label>
            <AdminSelect
              label="Category"
              value={value.category}
              options={categories}
              onChange={(category) => update({ category })}
            />
          </div>

          <label>
            Raw story / notes
            <textarea
              value={value.rawNotes}
              onChange={(event) => update({ rawNotes: event.target.value })}
              placeholder="Tell the rough story, timeline, what happened, what you learned, and what feeling you want the article to carry."
              rows={8}
              required
            />
          </label>

          <div className="admin-form-pair">
            <AdminSelect
              label="Language"
              value={value.language}
              onChange={(language) => update({ language })}
              options={[
                { value: "English", label: "English" },
                { value: "Indonesian", label: "Indonesian" },
                { value: "Mixed Indonesian-English", label: "Mixed casual" },
              ]}
            />
            <AdminSelect
              label="Length"
              value={value.targetLength}
              onChange={(targetLength) => update({ targetLength })}
              options={[
                { value: "short", label: "Short" },
                { value: "medium", label: "Medium" },
                { value: "long", label: "Long" },
              ]}
            />
          </div>
          <p className="admin-help">
            Length is sent to the n8n/Gemini prompt as guidance: short creates fewer blocks, medium balances story and detail, long asks for a fuller reflection.
          </p>

          <label>
            Tone
            <input
              value={value.tone}
              onChange={(event) => update({ tone: event.target.value })}
              placeholder="reflective, grounded, personal, professional"
            />
          </label>

          <details>
            <summary className="admin-seo-toggle">Extra context (optional)</summary>
            <div className="admin-form-nested">
              <label>
                Portfolio/source context
                <textarea
                  value={value.sourceContext}
                  onChange={(event) => update({ sourceContext: event.target.value })}
                  placeholder="Optional extra facts n8n should know for this specific article."
                  rows={3}
                />
              </label>
              <label>
                Writing style context
                <textarea
                  value={value.articleContext}
                  onChange={(event) => update({ articleContext: event.target.value })}
                  placeholder="Optional excerpt from article-context.md or writing preferences."
                  rows={3}
                />
              </label>
            </div>
          </details>

          <div className="admin-generator-media">
            <div className="admin-card-head">
              <div>
                <strong>Relevant photos</strong>
                <p className="admin-help">Only selected images are exposed to n8n. Add context so Gemini knows what each photo means.</p>
              </div>
              <span className="admin-badge">{value.mediaAssetIds.length} selected</span>
            </div>
            <AdminListTools
              label="Search images"
              value={mediaSearch}
              placeholder="Search photo filename, alt, or caption"
              count={filteredAssets.length}
              total={imageAssets.length}
              onChange={setMediaSearch}
            />
            <div className="admin-generator-media-grid">
              {filteredAssets.map((asset) => {
                const selected = value.mediaAssetIds.includes(asset.id);
                return (
                  <button
                    className={`admin-media-picker-item${selected ? " is-selected" : ""}`}
                    type="button"
                    key={asset.id}
                    aria-pressed={selected}
                    onClick={() => toggleAsset(asset.id)}
                  >
                    <span className="admin-media-picker-thumb">
                      <img src={asset.publicUrl} alt={asset.altText || asset.originalName} loading="lazy" />
                      {selected ? (
                        <span className="admin-media-picker-check">
                          <Check size={16} />
                        </span>
                      ) : null}
                    </span>
                    <span>{asset.originalName}</span>
                  </button>
                );
              })}
              {filteredAssets.length === 0 ? <p className="admin-empty">No image media matched this search.</p> : null}
            </div>

            {selectedAssets.length > 0 ? (
              <div className="admin-generator-context-list">
                {selectedAssets.map((asset) => (
                  <label className="admin-generator-context-item" key={asset.id}>
                    <img src={asset.publicUrl} alt={asset.altText || asset.originalName} loading="lazy" />
                    <span>
                      <strong>{asset.originalName}</strong>
                      <small>{asset.altText || asset.caption || "Add the story behind this photo"}</small>
                    </span>
                    <textarea
                      value={value.mediaContext[asset.id] ?? ""}
                      onChange={(event) => updateMediaContext(asset.id, event.target.value)}
                      placeholder="Who/what is in this photo? Why is it relevant?"
                      rows={2}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="admin-form-actions">
            <button className="btn" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving || !value.rawNotes.trim()}>
              <Sparkles size={15} /> {saving ? "Generating…" : "Generate Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function AdminFilePicker({
  label,
  accept,
  files,
  multiple = false,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  accept: string;
  files: File[];
  multiple?: boolean;
  placeholder: string;
  onChange: (files: File[]) => void;
  onClear?: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="admin-file-field">
      <span>{label}</span>
      <label className="admin-file-picker" htmlFor={inputId}>
        <input
          id={inputId}
          ref={inputRef}
          className="admin-file-input"
          accept={accept}
          multiple={multiple}
          onChange={(event) => onChange(Array.from(event.target.files ?? []))}
          type="file"
        />
        <span className="admin-file-icon">
          <Upload size={16} />
        </span>
        <span className="admin-file-copy">
          <strong>{selectedFilesLabel(files)}</strong>
          <small>{selectedFilesMeta(files, placeholder)}</small>
        </span>
      </label>
      {files.length > 0 ? (
        <div className="admin-file-selection">
          {files.slice(0, 4).map((file) => (
            <span className="admin-file-chip" key={`${file.name}-${file.size}-${file.lastModified}`}>
              {file.name}
            </span>
          ))}
          {files.length > 4 ? <span className="admin-file-chip">+{files.length - 4} more</span> : null}
          {onClear ? (
            <button
              className="icon-btn"
              type="button"
              aria-label={`Clear ${label}`}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                onClear();
              }}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function blockField(block: { contentJson: unknown }, field: "title" | "text" | "imageKey" | "mediaAssetId" | "imageUrl") {
  const content = block.contentJson && typeof block.contentJson === "object" && !Array.isArray(block.contentJson) ? (block.contentJson as Record<string, unknown>) : {};
  return typeof content[field] === "string" ? content[field] : "";
}

function settingsField(settingsJson: unknown, field: keyof typeof emptyPageSection) {
  const settings = settingsJson && typeof settingsJson === "object" && !Array.isArray(settingsJson) ? (settingsJson as Record<string, unknown>) : {};
  return typeof settings[field] === "string" ? settings[field] : "";
}

function pageSectionSettings(form: typeof emptyPageSection) {
  return {
    titleAlign: form.titleAlign || undefined,
    bodyAlign: form.bodyAlign || undefined,
    imageKey: form.imageKey || undefined,
    mediaAssetId: form.mediaAssetId || undefined,
    imageUrl: form.imageUrl || undefined,
    ctaLabel: form.ctaLabel || undefined,
    ctaHref: form.ctaHref || undefined,
    primaryCtaLabel: form.primaryCtaLabel || undefined,
    primaryCtaHref: form.primaryCtaHref || undefined,
    secondaryCtaLabel: form.secondaryCtaLabel || undefined,
    secondaryCtaHref: form.secondaryCtaHref || undefined,
    tertiaryCtaLabel: form.tertiaryCtaLabel || undefined,
    tertiaryCtaHref: form.tertiaryCtaHref || undefined,
  };
}

function defaultBlockContent(type: string): Record<string, unknown> {
  switch (type) {
    case "paragraph": return { text: "", align: "left" };
    case "heading": return { text: "", level: 2, align: "left" };
    case "image": return { src: "", alt: "", caption: "", layout: "inline" };
    case "gallery": return { images: [], layout: "grid" };
    case "quote": return { text: "", source: "" };
    case "callout": return { variant: "note", title: "", text: "" };
    case "list": return { items: [""], style: "bullet" };
    case "code": return { code: "", language: "" };
    case "divider": return {};
    default: return { text: "" };
  }
}

function AlignmentSelect({
  label = "Alignment",
  value,
  onChange,
}: {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <AdminSelect
      label={label}
      value={value || "left"}
      onChange={onChange}
      options={textAlignOptions}
    />
  );
}

function publicPagePath(slug: string) {
  if (slug === "home") return "/";
  if (slug === "lead-self") return "/lead-self";
  return `/${slug}`;
}

const cardEnabledSections: Record<string, string[]> = {
  home: ["early-story", "values"],
  "lead-self": ["evidence"],
};

function sectionSupportsCards(pageSlug?: string | null, sectionKey?: string | null) {
  if (!pageSlug || !sectionKey) return false;
  return cardEnabledSections[pageSlug]?.includes(sectionKey) ?? false;
}

function BlockDraftForm({
  type,
  value,
  onChange,
  imageAssets,
}: {
  type: string;
  value: Record<string, unknown>;
  onChange: (val: Record<string, unknown>) => void;
  imageAssets: AdminMediaAsset[];
}) {
  const update = (key: string, val: unknown) => onChange({ ...value, [key]: val });

  switch (type) {
    case "heading":
      return (
        <>
          <label>
            Heading Text
            <input value={(value.text as string) || ""} onChange={(e) => update("text", e.target.value)} />
          </label>
          <AdminSelect
            label="Level"
            value={String((value.level as number) || 2)}
            onChange={(v) => update("level", Number(v))}
            options={[
              { value: "2", label: "H2" },
              { value: "3", label: "H3" },
              { value: "4", label: "H4" },
            ]}
          />
          <AlignmentSelect value={(value.align as string) || "left"} onChange={(v) => update("align", v)} />
        </>
      );
    case "paragraph":
      return (
        <>
          <label>
            Text (Markdown supported)
            <textarea value={(value.text as string) || ""} onChange={(e) => update("text", e.target.value)} rows={4} />
          </label>
          <AlignmentSelect value={(value.align as string) || "left"} onChange={(v) => update("align", v)} />
        </>
      );
    case "image":
      return (
        <>
          <AdminSelect
            label="Image Asset"
            value={imageAssets.find((a) => a.publicUrl === value.src)?.id ?? ""}
            onChange={(v) => {
              const asset = imageAssets.find((a) => a.id === v);
              if (asset) update("src", asset.publicUrl);
            }}
            options={imageAssets.map((asset) => ({
              value: asset.id,
              label: asset.originalName,
            }))}
            placeholder="Select an image…"
          />
          <label>
            Alt Text
            <input value={(value.alt as string) || ""} onChange={(e) => update("alt", e.target.value)} />
          </label>
          <label>
            Caption
            <input value={(value.caption as string) || ""} onChange={(e) => update("caption", e.target.value)} />
          </label>
          <AdminSelect
            label="Layout"
            value={(value.layout as string) || "inline"}
            onChange={(v) => update("layout", v)}
            options={[
              { value: "inline", label: "Inline" },
              { value: "full", label: "Full width" },
            ]}
          />
        </>
      );
    case "gallery":
      return (
        <>
          <label>Select Images</label>
          <div className="admin-gallery-picker" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "8px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
            {imageAssets.map((asset) => {
              const currentImages = (value.images as { src: string }[]) || [];
              const isSelected = currentImages.some((i) => i.src === asset.publicUrl);
              return (
                <label key={asset.id} className="admin-check" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        update("images", [...currentImages, { src: asset.publicUrl, alt: asset.altText, caption: asset.caption }]);
                      } else {
                        update("images", currentImages.filter((i) => i.src !== asset.publicUrl));
                      }
                    }}
                  />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.originalName}</span>
                </label>
              );
            })}
          </div>
          <AdminSelect
            label="Layout"
            value={(value.layout as string) || "grid"}
            onChange={(v) => update("layout", v)}
            options={[
              { value: "grid", label: "Grid Layout" },
              { value: "carousel", label: "Carousel Layout" },
            ]}
          />
        </>
      );
    case "quote":
      return (
        <>
          <label>
            Quote
            <textarea value={(value.text as string) || ""} onChange={(e) => update("text", e.target.value)} rows={3} />
          </label>
          <label>
            Source / Author
            <input value={(value.source as string) || ""} onChange={(e) => update("source", e.target.value)} />
          </label>
        </>
      );
    case "callout":
      return (
        <>
          <AdminSelect
            label="Variant"
            value={(value.variant as string) || "note"}
            onChange={(v) => update("variant", v)}
            options={[
              { value: "note", label: "Note (Blue)" },
              { value: "warning", label: "Warning (Orange)" },
              { value: "success", label: "Success (Green)" },
            ]}
          />
          <label>
            Title (Optional)
            <input value={(value.title as string) || ""} onChange={(e) => update("title", e.target.value)} />
          </label>
          <label>
            Text (Markdown)
            <textarea value={(value.text as string) || ""} onChange={(e) => update("text", e.target.value)} rows={3} />
          </label>
        </>
      );
    case "list":
      return (
        <>
          <AdminSelect
            label="Style"
            value={(value.style as string) || "bullet"}
            onChange={(v) => update("style", v)}
            options={[
              { value: "bullet", label: "Bullet" },
              { value: "number", label: "Number" },
            ]}
          />
          <label>
            Items (One per line)
            <textarea
              value={Array.isArray(value.items) ? (value.items as string[]).join("\n") : ""}
              onChange={(e) => update("items", e.target.value.split("\n"))}
              rows={5}
            />
          </label>
        </>
      );
    case "code":
      return (
        <>
          <label>
            Language
            <input value={(value.language as string) || ""} onChange={(e) => update("language", e.target.value)} placeholder="typescript, json, bash..." />
          </label>
          <label>
            Code
            <textarea
              value={(value.code as string) || ""}
              onChange={(e) => update("code", e.target.value)}
              rows={8}
              style={{ fontFamily: "monospace", whiteSpace: "pre" }}
            />
          </label>
        </>
      );
    case "divider":
      return <p className="admin-empty">A visual divider will be placed here.</p>;
    default:
      return (
        <label>
          Raw JSON (Fallback)
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                // Ignore parse errors while typing
              }
            }}
            rows={5}
            style={{ fontFamily: "monospace" }}
          />
        </label>
      );
  }
}

export function Admin() {
  const [state, setState] = useState<AdminState>({ user: null, loading: true, error: null });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [certifications, setCertifications] = useState<AdminCertification[]>([]);
  const [systems, setSystems] = useState<AdminLiveSystem[]>([]);
  const [coreNodes, setCoreNodes] = useState<AdminCoreServerNode[]>([]);
  const [contacts, setContacts] = useState<AdminContactLink[]>([]);
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAsset[]>([]);
  const [resumeVersions, setResumeVersions] = useState<AdminResumeVersion[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [musicTracks, setMusicTracks] = useState<AdminMusicTrack[]>([]);
  const [sitePages, setSitePages] = useState<AdminSitePage[]>([]);
  const [categories, setCategories] = useState<AdminContentCategory[]>([]);
  const [contexts, setContexts] = useState<AdminContexts | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [certForm, setCertForm] = useState(emptyCertification);
  const [systemForm, setSystemForm] = useState(emptySystem);
  const [coreNodeForm, setCoreNodeForm] = useState(emptyCoreNode);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [resumeForm, setResumeForm] = useState(emptyResumeForm);
  const [mediaForm, setMediaForm] = useState({ altText: "", caption: "" });
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [musicForm, setMusicForm] = useState(emptyMusic);
  const [pageSectionForm, setPageSectionForm] = useState(emptyPageSection);
  const [pageBlockForm, setPageBlockForm] = useState(emptyPageBlock);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [editingCoreNodeId, setEditingCoreNodeId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
  const [editingPageSectionKey, setEditingPageSectionKey] = useState<string | null>(null);
  const [editingPageBlockId, setEditingPageBlockId] = useState<string | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState("home");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaPickerTarget | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [experienceSearch, setExperienceSearch] = useState("");
  const [musicSearch, setMusicSearch] = useState("");
  const [resumeSearch, setResumeSearch] = useState("");
  const [certificationSearch, setCertificationSearch] = useState("");
  const [systemSearch, setSystemSearch] = useState("");
  const [coreNodeSearch, setCoreNodeSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryScopeFilter, setCategoryScopeFilter] = useState<ContentCategoryScope | "">("");
  const [contextForm, setContextForm] = useState<Record<AdminContextKind, string>>(emptyContextForm);
  const [contextMode, setContextMode] = useState<Record<AdminContextKind, "append" | "override">>(emptyContextMode);
  const [securityForm, setSecurityForm] = useState(emptySecurityForm);
  const [articleSearch, setArticleSearch] = useState("");
  const [articleStatusFilter, setArticleStatusFilter] = useState("");
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState(emptyArticleForm);
  const [articleGeneratorOpen, setArticleGeneratorOpen] = useState(false);
  const [articleGeneratorForm, setArticleGeneratorForm] = useState<ArticleGeneratorForm>(emptyArticleGeneratorForm);
  const [articleBlocks, setArticleBlocks] = useState<ArticleBlockDraft[]>([]);
  const [articleLocalDraft, setArticleLocalDraft] = useState<ArticleLocalDraft | null>(null);
  const [articleAutosaveNotice, setArticleAutosaveNotice] = useState<string | null>(null);
  const [articlePreviewMode, setArticlePreviewMode] = useState<ArticlePreviewMode>("reader");
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [addingBlockType, setAddingBlockType] = useState<string | null>(null);
  const [insertAfterBlockIdx, setInsertAfterBlockIdx] = useState<number | null>(null);
  const [blockDraftForm, setBlockDraftForm] = useState<Record<string, unknown>>({});
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);
  const [themeData, setThemeData] = useState<AdminTheme>({});
  const [themeDefaults, setThemeDefaults] = useState<AdminTheme>({});
  const [themeForm, setThemeForm] = useState<AdminTheme>({});
  const [themeSaving, setThemeSaving] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<AdminBackupSummary | null>(null);
  const [backupImporting, setBackupImporting] = useState(false);
  const articleEditorBaselineRef = useRef(serializeArticleDraftPayload({
    editingArticleId: null,
    articleForm: emptyArticleForm,
    articleBlocks: [],
  }));
  const imageMediaAssets = useMemo(() => mediaAssets.filter((asset) => asset.mimeType.startsWith("image/")), [mediaAssets]);
  const audioMediaAssets = useMemo(() => mediaAssets.filter((asset) => asset.mimeType.startsWith("audio/")), [mediaAssets]);
  const filteredImageMediaAssets = useMemo(
    () => imageMediaAssets.filter((asset) => asset.originalName.toLowerCase().includes(mediaSearch.toLowerCase().trim())),
    [imageMediaAssets, mediaSearch],
  );
  const filteredMediaAssets = useMemo(() => {
    const query = mediaSearch.toLowerCase().trim();
    if (!query) return mediaAssets;
    return mediaAssets.filter((asset) => `${asset.originalName} ${asset.mimeType}`.toLowerCase().includes(query));
  }, [mediaAssets, mediaSearch]);
  const filteredAudioMediaAssets = useMemo(
    () => audioMediaAssets.filter((asset) => asset.originalName.toLowerCase().includes(mediaSearch.toLowerCase().trim())),
    [audioMediaAssets, mediaSearch],
  );
  const imageMediaOptions = useMemo(
    () => filteredImageMediaAssets.map((asset) => ({ value: asset.id, label: asset.originalName })),
    [filteredImageMediaAssets],
  );
  const audioMediaOptions = useMemo(
    () => filteredAudioMediaAssets.map((asset) => ({ value: asset.id, label: asset.originalName })),
    [filteredAudioMediaAssets],
  );
  const mediaById = useMemo(() => new Map(mediaAssets.map((asset) => [asset.id, asset])), [mediaAssets]);
  const articlePreviewBlocks = useMemo(() => publicArticleBlocksFromDraft(articleBlocks), [articleBlocks]);
  const articlePreviewTags = useMemo(() => articleDraftTags(articleForm.tags), [articleForm.tags]);
  const articlePreviewCover = articleForm.coverAssetId ? mediaById.get(articleForm.coverAssetId) : undefined;
  const articlePreviewReadingTime = useMemo(() => estimateArticleReadingTime(articleForm, articleBlocks), [articleBlocks, articleForm]);
  const projectCategoryOptions = useMemo(
    () => categoryOptionsFor(categories, "project", fallbackProjectCategories, projectForm.category),
    [categories, projectForm.category],
  );
  const experienceCategoryOptions = useMemo(
    () => categoryOptionsFor(categories, "experience", fallbackExperienceCategories, experienceForm.category),
    [categories, experienceForm.category],
  );
  const articleCategoryOptions = useMemo(
    () => categoryOptionsFor(categories, "article", fallbackArticleCategories, articleForm.category),
    [articleForm.category, categories],
  );
  const filteredProjects = useMemo(
    () => projects.filter((project) => matchesSearch(projectSearch, [project.title, project.slug, project.category, project.priority, project.status, project.summary, project.isFeatured, project.isPublished])),
    [projects, projectSearch],
  );
  const filteredExperiences = useMemo(
    () =>
      experiences.filter((experience) =>
        matchesSearch(experienceSearch, [experience.title, experience.slug, experience.organization, experience.period, experience.category, experience.summary, experience.isFeatured, experience.isPublished]),
      ),
    [experiences, experienceSearch],
  );
  const filteredMusicTracks = useMemo(
    () => musicTracks.filter((track) => matchesSearch(musicSearch, [track.title, track.artist, track.note, track.audioOriginalName, track.isActive])),
    [musicTracks, musicSearch],
  );
  const filteredResumeVersions = useMemo(
    () => resumeVersions.filter((resume) => matchesSearch(resumeSearch, [resume.label, resume.notes, resume.mediaAsset?.originalName, resume.isActive])),
    [resumeVersions, resumeSearch],
  );
  const filteredCertifications = useMemo(
    () => certifications.filter((certification) => matchesSearch(certificationSearch, [certification.title, certification.issuer, certification.issuedAt, certification.expiresAt, certification.skills.join(" "), certification.isFeatured])),
    [certifications, certificationSearch],
  );
  const filteredSystems = useMemo(
    () => systems.filter((system) => matchesSearch(systemSearch, [system.title, system.description, system.url, system.embedUrl, system.isPublished, system.isEmbeddable])),
    [systems, systemSearch],
  );
  const filteredCoreNodes = useMemo(
    () => coreNodes.filter((node) => matchesSearch(coreNodeSearch, [node.label, node.description, node.href, node.isPublished])),
    [coreNodes, coreNodeSearch],
  );
  const filteredContacts = useMemo(
    () => contacts.filter((contact) => matchesSearch(contactSearch, [contact.type, contact.label, contact.value, contact.url, contact.isPrimary])),
    [contacts, contactSearch],
  );
  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => {
        const matchesScope = !categoryScopeFilter || category.scope === categoryScopeFilter;
        return matchesScope && matchesSearch(categorySearch, [category.scope, category.label, category.slug, category.description, category.isActive, category.usageCount]);
      }),
    [categories, categoryScopeFilter, categorySearch],
  );
  const selectedSitePage = useMemo(() => sitePages.find((page) => page.slug === selectedPageSlug) ?? sitePages[0] ?? null, [sitePages, selectedPageSlug]);
  const pageOptions = useMemo(() => sitePages.map((page) => ({ value: page.slug, label: page.title })), [sitePages]);
  const selectedPageSection = useMemo(
    () => selectedSitePage?.sections.find((section) => section.key === editingPageSectionKey) ?? null,
    [editingPageSectionKey, selectedSitePage],
  );
  const selectedSectionSupportsCards = sectionSupportsCards(selectedSitePage?.slug, selectedPageSection?.key);

  useEffect(() => {
    if (!selectedSectionSupportsCards && editingPageBlockId) {
      resetPageBlockForm();
    }
  }, [editingPageBlockId, selectedSectionSupportsCards]);

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(articleAutosaveKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as ArticleLocalDraft;
      if (draft?.articleForm && Array.isArray(draft.articleBlocks) && draft.savedAt) {
        setArticleLocalDraft(draft);
      }
    } catch {
      window.localStorage.removeItem(articleAutosaveKey);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "articles") return;
    if (!hasArticleDraftContent(articleForm, articleBlocks)) return;

    const payload = {
      editingArticleId,
      articleForm,
      articleBlocks,
    };
    const serializedPayload = serializeArticleDraftPayload(payload);
    if (serializedPayload === articleEditorBaselineRef.current) return;

    const timeout = window.setTimeout(() => {
      const draft: ArticleLocalDraft = {
        ...payload,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(articleAutosaveKey, JSON.stringify(draft));
      setArticleLocalDraft(draft);
      setArticleAutosaveNotice(`Local draft saved ${formatAuditDate(draft.savedAt)}`);
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activeTab, articleBlocks, articleForm, editingArticleId]);

  function handleSaveGallerySelection(selectedIds: string[]) {
    if (mediaPickerTarget === "projectGallery") {
      setProjectForm((current) => ({ ...current, galleryMediaAssetIds: selectedIds }));
    }

    if (mediaPickerTarget === "experienceGallery") {
      setExperienceForm((current) => ({ ...current, galleryMediaAssetIds: selectedIds }));
    }

    if (mediaPickerTarget === "pageBlockImage") {
      const mediaAssetId = selectedIds[0] ?? "";
      const asset = mediaById.get(mediaAssetId);
      setPageBlockForm((current) => ({
        ...current,
        mediaAssetId,
        imageUrl: asset?.publicUrl ?? "",
        imageKey: mediaAssetId ? "" : current.imageKey,
      }));
    }

    if (mediaPickerTarget === "pageSectionImage") {
      const mediaAssetId = selectedIds[0] ?? "";
      const asset = mediaById.get(mediaAssetId);
      setPageSectionForm((current) => ({
        ...current,
        mediaAssetId,
        imageUrl: asset?.publicUrl ?? "",
        imageKey: mediaAssetId ? "" : current.imageKey,
      }));
    }

    if (mediaPickerTarget === "articleCover") {
      const mediaAssetId = selectedIds[0] ?? "";
      setArticleForm((current) => ({ ...current, coverAssetId: mediaAssetId }));
    }

    setMediaPickerTarget(null);
  }

  async function loadAdminData() {
    const [certificationResponse, systemResponse, coreNodeResponse, contactResponse, categoryResponse, mediaResponse, resumeResponse, projectResponse, experienceResponse, musicResponse, pagesResponse, articlesResponse, themeResponse, contextResponse, auditResponse] = await Promise.allSettled([
      adminApi.certifications(),
      adminApi.systems(),
      adminApi.coreNodes(),
      adminApi.contact(),
      adminApi.categories(),
      adminApi.media(),
      adminApi.resume(),
      adminApi.projects(),
      adminApi.experiences(),
      adminApi.music(),
      adminApi.pages(),
      adminApi.articles(),
      adminApi.getTheme(),
      adminApi.contexts(),
      adminApi.auditLogs({ limit: 50 }),
    ]);

    if (certificationResponse.status === "fulfilled") setCertifications(certificationResponse.value.data);
    if (systemResponse.status === "fulfilled") setSystems(systemResponse.value.data);
    if (coreNodeResponse.status === "fulfilled") setCoreNodes(coreNodeResponse.value.data);
    if (contactResponse.status === "fulfilled") setContacts(contactResponse.value.data);
    if (categoryResponse.status === "fulfilled") setCategories(categoryResponse.value.data);
    if (mediaResponse.status === "fulfilled") setMediaAssets(mediaResponse.value.data);
    if (resumeResponse.status === "fulfilled") setResumeVersions(resumeResponse.value.data);
    if (projectResponse.status === "fulfilled") setProjects(projectResponse.value.data);
    if (experienceResponse.status === "fulfilled") setExperiences(experienceResponse.value.data);
    if (musicResponse.status === "fulfilled") setMusicTracks(musicResponse.value.data);
    if (pagesResponse.status === "fulfilled") {
      setSitePages(pagesResponse.value.data);
      setSelectedPageSlug((current) => pagesResponse.value.data.some((page) => page.slug === current) ? current : pagesResponse.value.data[0]?.slug ?? "home");
    }
    if (articlesResponse.status === "fulfilled") setArticles(articlesResponse.value.data);
    if (themeResponse.status === "fulfilled") {
      setThemeData(themeResponse.value.data);
      setThemeDefaults(themeResponse.value.defaults);
      setThemeForm(themeResponse.value.data);
    }
    if (contextResponse.status === "fulfilled") {
      setContexts(contextResponse.value.data);
      setContextForm({
        portfolio: contextResponse.value.data.portfolio.manualMarkdown,
        article: contextResponse.value.data.article.manualMarkdown,
      });
      setContextMode({
        portfolio: contextResponse.value.data.portfolio.mode,
        article: contextResponse.value.data.article.mode,
      });
    }
    if (auditResponse.status === "fulfilled") setAuditLogs(auditResponse.value.data);

    const failures = [certificationResponse, systemResponse, contactResponse, categoryResponse, mediaResponse, resumeResponse, projectResponse, experienceResponse, musicResponse, pagesResponse, articlesResponse, contextResponse, auditResponse].filter(
      (response) => response.status === "rejected",
    );
    if (failures.length > 0) {
      setNotice("Some admin data could not be loaded. Try refresh data.");
    }
  }

  useEffect(() => {
    adminApi
      .me()
      .then(({ user }) => {
        setState({ user, loading: false, error: null });
        void loadAdminData();
      })
      .catch(() => setState({ user: null, loading: false, error: null }));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const { user } = await adminApi.login(email, password);
      setState({ user, loading: false, error: null });
      void loadAdminData();
    } catch (error) {
      setState({ user: null, loading: false, error: error instanceof Error ? error.message : "Login failed" });
    }
  }

  async function handleLogout() {
    await adminApi.logout().catch(() => undefined);
    setState({ user: null, loading: false, error: null });
    setCertifications([]);
    setSystems([]);
    setContacts([]);
    setMediaAssets([]);
    setResumeVersions([]);
    setProjects([]);
    setExperiences([]);
    setMusicTracks([]);
    setSitePages([]);
    setCategories([]);
    setArticles([]);
    setThemeData({});
    setThemeForm({});
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setNotice("New password confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      setNotice(null);
      const activeEmail = state.user?.email;
      if (!activeEmail) {
        throw new Error("Authentication required");
      }

      const { user } = await adminApi.changePassword(activeEmail, securityForm.currentPassword, securityForm.newPassword);
      setState({ user, loading: false, error: null });
      setSecurityForm(emptySecurityForm);
      await loadAdminData();
      setNotice("Password updated and active admin sessions were rotated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password.";
      if (message === "Authentication required" || message === "Session expired") {
        setState({ user: null, loading: false, error: null });
      }
      setNotice(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCertification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const payload = {
        ...certForm,
        skills: certForm.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      };
      if (editingCertificationId) {
        await adminApi.updateCertification(editingCertificationId, payload);
      } else {
        await adminApi.createCertification(payload);
      }
      resetCertificationForm();
      await loadAdminData();
      setNotice(editingCertificationId ? "Certification updated." : "Certification added.");
      setEditingCertificationId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save certification.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingSystemId) {
        await adminApi.updateSystem(editingSystemId, systemForm);
      } else {
        await adminApi.createSystem(systemForm);
      }
      resetSystemForm();
      await loadAdminData();
      setNotice(editingSystemId ? "Live system updated." : "Live system added.");
      setEditingSystemId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save live system.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCoreNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingCoreNodeId) {
        await adminApi.updateCoreNode(editingCoreNodeId, coreNodeForm);
      } else {
        await adminApi.createCoreNode(coreNodeForm);
      }
      resetCoreNodeForm();
      await loadAdminData();
      setNotice(editingCoreNodeId ? "Core node updated." : "Core node added.");
      setEditingCoreNodeId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save core node.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingContactId) {
        await adminApi.updateContact(editingContactId, contactForm);
      } else {
        await adminApi.createContact(contactForm);
      }
      resetContactForm();
      await loadAdminData();
      setNotice(editingContactId ? "Contact link updated." : "Contact link added.");
      setEditingContactId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save contact link.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, categoryForm);
      } else {
        await adminApi.createCategory(categoryForm);
      }
      resetCategoryForm();
      await loadAdminData();
      setNotice(editingCategoryId ? "Category updated." : "Category added.");
      setEditingCategoryId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const payload = {
        ...projectForm,
        roles: projectForm.roles.split(",").map((item) => item.trim()).filter(Boolean),
        techStack: projectForm.techStack.split(",").map((item) => item.trim()).filter(Boolean),
        learnings: projectForm.learnings.split(",").map((item) => item.trim()).filter(Boolean),
        galleryMediaAssetIds: projectForm.galleryMediaAssetIds,
      };
      if (editingProjectId) {
        await adminApi.updateProject(editingProjectId, payload);
      } else {
        await adminApi.createProject(payload);
      }
      resetProjectForm();
      await loadAdminData();
      setNotice(editingProjectId ? "Project updated." : "Project added.");
      setEditingProjectId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const wasEditing = Boolean(editingExperienceId);
      const payload = {
        ...experienceForm,
        responsibilities: experienceForm.responsibilities.split(",").map((item) => item.trim()).filter(Boolean),
        impact: experienceForm.impact.split(",").map((item) => item.trim()).filter(Boolean),
        values: experienceForm.values.split(",").map((item) => item.trim()).filter(Boolean),
        galleryMediaAssetIds: experienceForm.galleryMediaAssetIds,
      };
      if (editingExperienceId) {
        await adminApi.updateExperience(editingExperienceId, payload);
      } else {
        await adminApi.createExperience(payload);
      }
      resetExperienceForm();
      await loadAdminData();
      setNotice(wasEditing ? "Experience updated." : "Experience added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save experience.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMusic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const wasEditing = Boolean(editingMusicId);
      if (editingMusicId) {
        await adminApi.updateMusic(editingMusicId, musicForm);
      } else {
        await adminApi.createMusic(musicForm);
      }
      resetMusicForm();
      await loadAdminData();
      setNotice(wasEditing ? "Music track updated." : "Music track added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save music track.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePageSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSitePage || !editingPageSectionKey) {
      setNotice("Choose a page section first.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      await adminApi.updatePageSection(selectedSitePage.slug, editingPageSectionKey, {
        title: pageSectionForm.title,
        subtitle: pageSectionForm.subtitle,
        body: pageSectionForm.body,
        settingsJson: pageSectionSettings(pageSectionForm),
        sortOrder: pageSectionForm.sortOrder,
        isPublished: pageSectionForm.isPublished,
      });
      await loadAdminData();
      setNotice(`${selectedSitePage.title} section updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update page section.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePageBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSitePage || !editingPageSectionKey) {
      setNotice("Choose a page section first.");
      return;
    }
    if (!sectionSupportsCards(selectedSitePage.slug, editingPageSectionKey)) {
      setNotice("This section does not render repeatable cards on the public page.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const wasEditing = Boolean(editingPageBlockId);
      const payload = {
        type: "card",
        contentJson: {
          title: pageBlockForm.title,
          text: pageBlockForm.text,
          imageKey: pageBlockForm.imageKey || undefined,
          mediaAssetId: pageBlockForm.mediaAssetId || undefined,
          imageUrl: pageBlockForm.imageUrl || undefined,
        },
        sortOrder: pageBlockForm.sortOrder,
        isPublished: pageBlockForm.isPublished,
      };

      if (editingPageBlockId) {
        await adminApi.updatePageBlock(selectedSitePage.slug, editingPageSectionKey, editingPageBlockId, payload);
      } else {
        await adminApi.createPageBlock(selectedSitePage.slug, editingPageSectionKey, payload);
      }

      resetPageBlockForm();
      await loadAdminData();
      setNotice(wasEditing ? "Content block updated." : "Content block added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save content block.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderPageBlock(blockId: string, direction: "up" | "down") {
    if (!selectedSitePage || !selectedPageSection) return;
    const nextItems = moveId(selectedPageSection.blocks, blockId, direction);
    if (!nextItems) return;

    setSaving(true);
    setNotice(null);
    try {
      await adminApi.reorderPageBlocks(selectedSitePage.slug, selectedPageSection.key, { ids: nextItems.map((item) => item.id) });
      await loadAdminData();
      setNotice("Content blocks reordered.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder content blocks.");
    } finally {
      setSaving(false);
    }
  }


  async function handleUploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mediaFiles.length === 0) {
      setNotice("Choose at least one file first.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const upload = await adminApi.uploadMediaBatch(mediaFiles);
      const uploadedIds = new Set(upload.data.map((asset) => asset.id));
      setMediaAssets((current) => [...upload.data, ...current.filter((asset) => !uploadedIds.has(asset.id))]);
      setMediaFiles([]);
      event.currentTarget.reset();
      void loadAdminData();
      setNotice(`${upload.data.length} media file${upload.data.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to upload media.");
    } finally {
      setSaving(false);
    }
  }

  function editMedia(asset: AdminMediaAsset) {
    setEditingMediaId(asset.id);
    setMediaForm({ altText: asset.altText || "", caption: asset.caption || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetMediaForm() {
    setEditingMediaId(null);
    setMediaForm({ altText: "", caption: "" });
  }

  async function handleUpdateMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMediaId) return;

    setSaving(true);
    setNotice(null);
    try {
      const update = await adminApi.updateMedia(editingMediaId, mediaForm);
      setMediaAssets((current) => current.map((asset) => (asset.id === update.data.id ? update.data : asset)));
      resetMediaForm();
      setNotice("Media updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update media.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeFile) {
      setNotice("Choose a CV PDF first.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const media = await adminApi.uploadMedia(resumeFile);
      const resume = await adminApi.createResume({
        label: resumeForm.label || resumeFile.name,
        notes: resumeForm.notes,
        mediaAssetId: media.data.id,
      });
      const activated = await adminApi.activateResume(resume.data.id);
      setMediaAssets((current) => [media.data, ...current.filter((asset) => asset.id !== media.data.id)]);
      setResumeVersions((current) => [
        activated.data,
        ...current.filter((version) => version.id !== activated.data.id).map((version) => ({ ...version, isActive: false })),
      ]);
      setResumeFile(null);
      setResumeForm(emptyResumeForm);
      event.currentTarget.reset();
      void loadAdminData();
      setNotice("Resume uploaded and activated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to create resume version.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateResume(id: string) {
    setSaving(true);
    setNotice(null);
    try {
      const resume = await adminApi.activateResume(id);
      setResumeVersions((current) => current.map((version) => (version.id === id ? resume.data : { ...version, isActive: false })));
      void loadAdminData();
      setNotice("Resume activated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to activate resume.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderProjects(id: string, direction: "up" | "down") {
    const nextItems = moveId(projects, id, direction);
    if (!nextItems) return;
    setProjects(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderProjects({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder projects.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderExperiences(id: string, direction: "up" | "down") {
    const nextItems = moveId(experiences, id, direction);
    if (!nextItems) return;
    setExperiences(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderExperiences({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder experiences.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderMusic(id: string, direction: "up" | "down") {
    const nextItems = moveId(musicTracks, id, direction);
    if (!nextItems) return;
    setMusicTracks(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderMusic({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder music tracks.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderCertifications(id: string, direction: "up" | "down") {
    const nextItems = moveId(certifications, id, direction);
    if (!nextItems) return;
    setCertifications(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderCertifications({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder certifications.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderSystems(id: string, direction: "up" | "down") {
    const nextItems = moveId(systems, id, direction);
    if (!nextItems) return;
    setSystems(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderSystems({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder systems.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderCoreNodes(id: string, direction: "up" | "down") {
    const currentIndex = coreNodes.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= coreNodes.length) return;

    const newOrder = [...coreNodes];
    const [movedItem] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    setCoreNodes(newOrder);
    setSaving(true);
    try {
      await adminApi.reorderCoreNodes({ ids: newOrder.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder core nodes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderContact(id: string, direction: "up" | "down") {
    const nextItems = moveId(contacts, id, direction);
    if (!nextItems) return;
    setContacts(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderContact({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder contact links.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderCategories(id: string, direction: "up" | "down") {
    const category = categories.find((item) => item.id === id);
    if (!category) return;
    const scopedCategories = categories.filter((item) => item.scope === category.scope);
    const nextScopedCategories = moveId(scopedCategories, id, direction);
    if (!nextScopedCategories) return;

    const nextScopedIdSet = new Set(nextScopedCategories.map((item) => item.id));
    setCategories((current) => [
      ...current.filter((item) => !nextScopedIdSet.has(item.id)),
      ...nextScopedCategories,
    ].sort((a, b) => a.scope.localeCompare(b.scope) || a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)));

    setSaving(true);
    try {
      await adminApi.reorderCategories({ ids: nextScopedCategories.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder categories.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  // ─── Article Handlers ──────────────────────────────────────────────────────

  function setArticleEditorBaseline(editingId: string | null, form: ArticleEditorForm, blocks: ArticleBlockDraft[]) {
    articleEditorBaselineRef.current = serializeArticleDraftPayload({
      editingArticleId: editingId,
      articleForm: form,
      articleBlocks: blocks,
    });
  }

  function clearArticleLocalDraft() {
    window.localStorage.removeItem(articleAutosaveKey);
    setArticleLocalDraft(null);
    setArticleAutosaveNotice(null);
  }

  function restoreArticleLocalDraft() {
    if (!articleLocalDraft) return;
    setActiveTab("articles");
    setEditingArticleId(articleLocalDraft.editingArticleId);
    setArticleForm(articleLocalDraft.articleForm);
    setArticleBlocks(articleLocalDraft.articleBlocks);
    setEditingBlockIdx(null);
    setAddingBlockType(null);
    setInsertAfterBlockIdx(null);
    setBlockDraftForm({});
    setArticleAutosaveNotice(`Local draft restored from ${formatAuditDate(articleLocalDraft.savedAt)}`);
    setArticleEditorBaseline(articleLocalDraft.editingArticleId, articleLocalDraft.articleForm, articleLocalDraft.articleBlocks);
  }

  function resetArticleForm() {
    setArticleForm(emptyArticleForm);
    setArticleBlocks([]);
    setEditingArticleId(null);
    setEditingBlockIdx(null);
    setAddingBlockType(null);
    setInsertAfterBlockIdx(null);
    setBlockDraftForm({});
    setArticleEditorBaseline(null, emptyArticleForm, []);
  }

  function editArticle(article: AdminArticle) {
    const nextForm = {
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle ?? "",
      excerpt: article.excerpt,
      category: article.category,
      status: article.status,
      isFeatured: article.isFeatured,
      coverAssetId: article.coverAssetId ?? "",
      seoTitle: article.seoTitle ?? "",
      seoDescription: article.seoDescription ?? "",
      generatorMeta: article.generatorMeta ?? null,
      authorName: article.author.name,
      authorRole: article.author.role ?? "",
      tags: article.tags.join(", "),
    };
    const nextBlocks = article.blocks.map((b) => ({
      id: b.id || `local-${Math.random()}`,
      type: b.type,
      contentJson: (b.contentJson && typeof b.contentJson === "object" && !Array.isArray(b.contentJson))
        ? (b.contentJson as Record<string, unknown>)
        : {},
    }));

    setActiveTab("articles");
    setEditingArticleId(article.id);
    setArticleForm(nextForm);
    setArticleBlocks(nextBlocks);
    setEditingBlockIdx(null);
    setAddingBlockType(null);
    setInsertAfterBlockIdx(null);
    setArticleEditorBaseline(article.id, nextForm, nextBlocks);
  }

  async function saveArticle(keepEditing = false) {
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        title: articleForm.title,
        slug: articleForm.slug,
        subtitle: articleForm.subtitle,
        excerpt: articleForm.excerpt,
        category: articleForm.category,
        status: articleForm.status,
        isFeatured: articleForm.isFeatured,
        coverAssetId: articleForm.coverAssetId,
        seoTitle: articleForm.seoTitle,
        seoDescription: articleForm.seoDescription,
        authorName: articleForm.authorName,
        authorRole: articleForm.authorRole,
        tags: articleForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        blocks: articleBlocks.map((b, i) => ({
          type: b.type,
          contentJson: b.contentJson,
          sortOrder: i,
        })),
      };
      if (editingArticleId) {
        const result = await adminApi.updateArticle(editingArticleId, payload);
        setNotice(keepEditing ? "Article updated. Keep editing below." : "Article updated.");
        if (keepEditing) {
          editArticle(result.data);
        }
      } else {
        const result = await adminApi.createArticle(payload);
        setNotice(keepEditing ? "Article created. Keep editing below." : "Article created.");
        if (keepEditing) {
          editArticle(result.data);
        }
      }

      if (!keepEditing) {
        resetArticleForm();
      }
      clearArticleLocalDraft();
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save article.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveArticle(false);
  }

  async function handlePublishArticle(id: string, publish: boolean) {
    setSaving(true);
    setNotice(null);
    try {
      if (publish) {
        await adminApi.publishArticle(id);
        setNotice("Article published.");
      } else {
        await adminApi.unpublishArticle(id);
        setNotice("Article unpublished.");
      }
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to change publish status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateArticle(id: string) {
    setSaving(true);
    setNotice(null);
    try {
      await adminApi.duplicateArticle(id);
      setNotice("Article duplicated as draft.");
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to duplicate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateArticleDraft() {
    setSaving(true);
    setNotice(null);
    try {
      const result = await adminApi.generateArticleDraft({
        ...articleGeneratorForm,
        topic: articleGeneratorForm.topic.trim(),
        rawNotes: articleGeneratorForm.rawNotes.trim(),
        sourceContext: articleGeneratorForm.sourceContext.trim(),
        articleContext: articleGeneratorForm.articleContext.trim(),
      });
      setArticles((current) => [result.data, ...current.filter((article) => article.id !== result.data.id)]);
      editArticle(result.data);
      setArticleGeneratorOpen(false);
      setArticleGeneratorForm(emptyArticleGeneratorForm);
      setNotice(result.data.coverAssetId
        ? "Generated draft created with an auto-assigned cover. Review the blocks before publishing."
        : "Generated draft created. No cover was assigned, so choose one before publishing if needed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to generate article draft.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Block Editor ─────────────────────────────────────────────────────────

  function addBlock(type: string, insertAfterIndex: number | null = null) {
    setAddingBlockType(type);
    setEditingBlockIdx(null);
    setInsertAfterBlockIdx(insertAfterIndex);
    setBlockDraftForm(defaultBlockContent(type));
  }

  function saveBlockDraft() {
    if (!addingBlockType) return;
    const newBlock: ArticleBlockDraft = {
      id: `local-${Date.now()}-${Math.random()}`,
      type: addingBlockType,
      contentJson: blockDraftForm,
    };
    setArticleBlocks((current) => {
      if (insertAfterBlockIdx === null) return [...current, newBlock];
      const next = [...current];
      next.splice(insertAfterBlockIdx + 1, 0, newBlock);
      return next;
    });
    setAddingBlockType(null);
    setInsertAfterBlockIdx(null);
    setBlockDraftForm({});
  }

  function updateBlockDraft() {
    if (editingBlockIdx === null) return;
    setArticleBlocks((current) =>
      current.map((b, i) =>
        i === editingBlockIdx ? { ...b, contentJson: blockDraftForm } : b,
      ),
    );
    setEditingBlockIdx(null);
    setBlockDraftForm({});
  }

  function deleteBlock(index: number) {
    setArticleBlocks((current) => current.filter((_, i) => i !== index));
    if (editingBlockIdx === index) {
      setEditingBlockIdx(null);
      setBlockDraftForm({});
    }
  }

  function moveArticleBlock(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= articleBlocks.length) return;

    setArticleBlocks((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    if (editingBlockIdx === index) {
      setEditingBlockIdx(targetIndex);
      return;
    }

    if (editingBlockIdx === targetIndex) {
      setEditingBlockIdx(index);
    }
  }

  function duplicateBlock(index: number) {
    const source = articleBlocks[index];
    if (!source) return;

    const clonedContent = JSON.parse(JSON.stringify(source.contentJson)) as Record<string, unknown>;
    setArticleBlocks((current) => {
      const next = [...current];
      next.splice(index + 1, 0, {
        id: `local-${Date.now()}-${Math.random()}`,
        type: source.type,
        contentJson: clonedContent,
      });
      return next;
    });
  }

  function startEditBlock(index: number) {
    setEditingBlockIdx(index);
    setAddingBlockType(null);
    setInsertAfterBlockIdx(null);
    setBlockDraftForm({ ...(articleBlocks[index]?.contentJson ?? {}) });
  }

  function prepareInsertAfterBlock(index: number) {
    setInsertAfterBlockIdx(index);
    setEditingBlockIdx(null);
    setAddingBlockType(null);
    setBlockDraftForm({});
  }

  // Drag and drop handlers
  function handleBlockDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleBlockDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverBlockIdx(index);
  }

  function handleBlockDrop(e: DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDragOverBlockIdx(null);
      return;
    }
    setArticleBlocks((current) => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragOverBlockIdx(null);
    // Update editingBlockIdx to follow the moved block
    if (editingBlockIdx === sourceIndex) setEditingBlockIdx(targetIndex);
    else if (editingBlockIdx !== null) {
      if (sourceIndex < editingBlockIdx && targetIndex >= editingBlockIdx) setEditingBlockIdx(editingBlockIdx - 1);
      else if (sourceIndex > editingBlockIdx && targetIndex <= editingBlockIdx) setEditingBlockIdx(editingBlockIdx + 1);
    }
  }

  function handleBlockDragEnd() {
    setDragOverBlockIdx(null);
  }

  // ─── Theme Handlers ────────────────────────────────────────────────────────

  async function handleSaveTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setThemeSaving(true);
    setNotice(null);
    try {
      const result = await adminApi.saveTheme(themeForm);
      setThemeData(result.data);
      setThemeForm(result.data);
      applyThemeVariables(result.data);
      setNotice("Theme saved and applied.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save theme.");
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleResetTheme() {
    setThemeSaving(true);
    setNotice(null);
    try {
      const result = await adminApi.resetTheme();
      setThemeData(result.data);
      setThemeForm(result.data);
      clearThemeVariables();
      setNotice("Theme reset to defaults.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reset theme.");
    } finally {
      setThemeSaving(false);
    }
  }

  function handlePreviewTheme() {
    applyThemeVariables(themeForm);
    setNotice("Theme preview applied locally. Save to keep it.");
  }

  function applyThemePreset(values: Record<string, string>) {
    const nextTheme = { ...themeDefaults, ...themeForm, ...values };
    setThemeForm(nextTheme);
    applyThemeVariables(nextTheme);
  }

  async function handlePreviewBackupImport() {
    if (!backupFile) {
      setNotice("Choose a CMS backup JSON first.");
      return;
    }
    setBackupImporting(true);
    setNotice(null);
    try {
      const result = await adminApi.previewImportBackup(backupFile);
      setBackupPreview(result.data);
      setNotice("Backup preview ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to preview backup.");
    } finally {
      setBackupImporting(false);
    }
  }

  async function handleImportBackup() {
    if (!backupFile) {
      setNotice("Choose a CMS backup JSON first.");
      return;
    }
    setBackupImporting(true);
    setNotice(null);
    try {
      const result = await adminApi.importBackup(backupFile);
      setBackupPreview(result.data);
      await loadAdminData();
      setNotice("Backup imported in merge mode.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to import backup.");
    } finally {
      setBackupImporting(false);
    }
  }

  async function handleSaveContext(kind: AdminContextKind) {
    setSaving(true);
    setNotice(null);
    try {
      const result = await adminApi.updateContext(kind, { manualMarkdown: contextForm[kind], mode: contextMode[kind] });
      setContextForm((current) => ({ ...current, [kind]: result.data.manualMarkdown }));
      setContextMode((current) => ({ ...current, [kind]: result.data.mode }));
      await loadAdminData();
      setNotice(`${kind === "portfolio" ? "Chatbot" : "Article generator"} context updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save context.");
    } finally {
      setSaving(false);
    }
  }

  function setContextEditMode(kind: AdminContextKind, mode: "append" | "override") {
    setContextMode((current) => ({ ...current, [kind]: mode }));
    setContextForm((current) => {
      if (mode === "override") {
        return { ...current, [kind]: contexts?.[kind].finalMarkdown ?? current[kind] };
      }

      return { ...current, [kind]: contextMode[kind] === "override" ? "" : current[kind] };
    });
  }

  function loadFinalContextIntoEditor(kind: AdminContextKind) {
    setContextMode((current) => ({ ...current, [kind]: "override" }));
    setContextForm((current) => ({ ...current, [kind]: contexts?.[kind].finalMarkdown ?? current[kind] }));
  }

  function resetCertificationForm() {
    setCertForm(emptyCertification);
    setEditingCertificationId(null);
  }

  function resetSystemForm() {
    setSystemForm(emptySystem);
    setEditingSystemId(null);
  }

  function resetContactForm() {
    setContactForm(emptyContact);
    setEditingContactId(null);
  }

  function resetCategoryForm() {
    setCategoryForm(emptyCategory);
    setEditingCategoryId(null);
  }

  function resetProjectForm() {
    setProjectForm(emptyProject);
    setEditingProjectId(null);
  }

  function resetExperienceForm() {
    setExperienceForm(emptyExperience);
    setEditingExperienceId(null);
  }

  function resetMusicForm() {
    setMusicForm(emptyMusic);
    setEditingMusicId(null);
  }

  function resetCoreNodeForm() {
    setCoreNodeForm(emptyCoreNode);
    setEditingCoreNodeId(null);
  }

  function resetPageSectionForm() {
    setPageSectionForm(emptyPageSection);
    setEditingPageSectionKey(null);
    resetPageBlockForm();
  }

  function resetPageBlockForm() {
    setPageBlockForm(emptyPageBlock);
    setEditingPageBlockId(null);
  }

  function editCertification(certification: AdminCertification) {
    setActiveTab("certifications");
    setEditingCertificationId(certification.id);
    setCertForm({
      title: certification.title,
      issuer: certification.issuer,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt ?? "",
      credentialUrl: certification.credentialUrl ?? "",
      skills: certification.skills.join(", "),
      isFeatured: certification.isFeatured,
      sortOrder: certification.sortOrder,
    });
  }

  function editSystem(system: AdminLiveSystem) {
    setActiveTab("systems");
    setEditingSystemId(system.id);
    setSystemForm({
      title: system.title,
      description: system.description,
      url: system.url,
      embedUrl: system.embedUrl ?? "",
      isEmbeddable: system.isEmbeddable,
      isPublished: system.isPublished,
      sortOrder: system.sortOrder,
    });
  }

  function editCoreNode(node: AdminCoreServerNode) {
    setActiveTab("core-nodes");
    setEditingCoreNodeId(node.id);
    setCoreNodeForm({
      label: node.label,
      description: node.description,
      href: node.href,
      positionX: node.positionX,
      positionY: node.positionY,
      sortOrder: node.sortOrder,
      isPublished: node.isPublished,
    });
  }

  function editContact(contact: AdminContactLink) {
    setActiveTab("contacts");
    setEditingContactId(contact.id);
    setContactForm({
      type: contact.type,
      label: contact.label,
      value: contact.value ?? "",
      url: contact.url,
      isPrimary: contact.isPrimary,
      sortOrder: contact.sortOrder,
    });
  }

  function editCategory(category: AdminContentCategory) {
    setActiveTab("categories");
    setEditingCategoryId(category.id);
    setCategoryForm({
      scope: category.scope,
      label: category.label,
      slug: category.slug,
      description: category.description ?? "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
  }

  function editProject(project: AdminProject) {
    setActiveTab("projects");
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      slug: project.slug,
      ecosystem: project.ecosystem ?? "",
      category: project.category,
      priority: project.priority,
      summary: project.summary,
      problem: project.problem,
      solution: project.solution,
      status: project.status,
      roles: project.roles.join(", "),
      techStack: project.techStack.join(", "),
      learnings: project.learnings.join(", "),
      demoUrl: project.links.demo ?? "",
      githubUrl: project.links.github ?? "",
      downloadUrl: project.links.download ?? "",
      coverMediaAssetId: project.mediaAssets.find((asset) => asset.kind === "cover")?.id ?? "",
      galleryMediaAssetIds: project.mediaAssets.filter((asset) => asset.kind !== "cover").map((asset) => asset.id),
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
      sortOrder: project.sortOrder,
    });
  }

  function editExperience(experience: AdminExperience) {
    setActiveTab("experiences");
    setEditingExperienceId(experience.id);
    setExperienceForm({
      title: experience.title,
      slug: experience.slug,
      organization: experience.organization,
      period: experience.period,
      category: experience.category,
      summary: experience.summary,
      responsibilities: experience.responsibilities.join(", "),
      impact: experience.impact.join(", "),
      reflection: experience.reflection,
      values: experience.values.join(", "),
      coverMediaAssetId: experience.mediaAssets.find((asset) => asset.kind === "cover")?.id ?? "",
      galleryMediaAssetIds: experience.mediaAssets.filter((asset) => asset.kind !== "cover").map((asset) => asset.id),
      isFeatured: experience.isFeatured,
      isPublished: experience.isPublished,
      sortOrder: experience.sortOrder,
    });
  }

  function editMusic(track: AdminMusicTrack) {
    setActiveTab("music");
    setEditingMusicId(track.id);
    setMusicForm({
      title: track.title,
      artist: track.artist,
      note: track.note,
      audioAssetId: track.audioAssetId ?? "",
      coverAssetId: track.coverAssetId ?? "",
      isActive: track.isActive,
      sortOrder: track.sortOrder,
    });
  }

  function editPageSection(section: AdminSiteSection) {
    setActiveTab("pages");
    setEditingPageSectionKey(section.key);
    setPageSectionForm({
      key: section.key,
      title: section.title ?? "",
      subtitle: section.subtitle ?? "",
      body: section.body ?? "",
      titleAlign: settingsField(section.settingsJson, "titleAlign") || "left",
      bodyAlign: settingsField(section.settingsJson, "bodyAlign") || "left",
      imageKey: settingsField(section.settingsJson, "imageKey"),
      mediaAssetId: settingsField(section.settingsJson, "mediaAssetId"),
      imageUrl: settingsField(section.settingsJson, "imageUrl"),
      ctaLabel: settingsField(section.settingsJson, "ctaLabel"),
      ctaHref: settingsField(section.settingsJson, "ctaHref"),
      primaryCtaLabel: settingsField(section.settingsJson, "primaryCtaLabel"),
      primaryCtaHref: settingsField(section.settingsJson, "primaryCtaHref"),
      secondaryCtaLabel: settingsField(section.settingsJson, "secondaryCtaLabel"),
      secondaryCtaHref: settingsField(section.settingsJson, "secondaryCtaHref"),
      tertiaryCtaLabel: settingsField(section.settingsJson, "tertiaryCtaLabel"),
      tertiaryCtaHref: settingsField(section.settingsJson, "tertiaryCtaHref"),
      sortOrder: section.sortOrder,
      isPublished: section.isPublished,
    });
    resetPageBlockForm();
  }

  function editPageBlock(block: AdminSiteBlock) {
    setEditingPageBlockId(block.id);
    setPageBlockForm({
      title: blockField(block, "title"),
      text: blockField(block, "text"),
      imageKey: blockField(block, "imageKey"),
      mediaAssetId: blockField(block, "mediaAssetId"),
      imageUrl: blockField(block, "imageUrl"),
      sortOrder: block.sortOrder,
      isPublished: block.isPublished,
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setNotice(null);
    try {
      if (deleteTarget.type === "certification") await adminApi.deleteCertification(deleteTarget.id);
      if (deleteTarget.type === "system") await adminApi.deleteSystem(deleteTarget.id);
      if (deleteTarget.type === "coreNode") await adminApi.deleteCoreNode(deleteTarget.id);
      if (deleteTarget.type === "contact") await adminApi.deleteContact(deleteTarget.id);
      if (deleteTarget.type === "media") await adminApi.deleteMedia(deleteTarget.id);
      if (deleteTarget.type === "project") await adminApi.deleteProject(deleteTarget.id);
      if (deleteTarget.type === "experience") await adminApi.deleteExperience(deleteTarget.id);
      if (deleteTarget.type === "music") await adminApi.deleteMusic(deleteTarget.id);
      if (deleteTarget.type === "article") await adminApi.deleteArticle(deleteTarget.id);
      if (deleteTarget.type === "category") await adminApi.deleteCategory(deleteTarget.id);
      if (deleteTarget.type === "pageBlock") await adminApi.deletePageBlock(deleteTarget.pageSlug, deleteTarget.sectionKey, deleteTarget.id);
      setDeleteTarget(null);
      await loadAdminData();
      setNotice(`${deleteTarget.label} removed.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to delete item.");
    } finally {
      setSaving(false);
    }
  }

  if (state.loading) {
    return (
      <section className="page-section admin-page">
        <div className="container">
          <Card>Loading admin...</Card>
        </div>
      </section>
    );
  }

  if (!state.user) {
    return (
      <section className="page-section admin-page">
        <div className="container admin-auth">
          <Card>
            <div className="section-kicker">Admin</div>
            <h1>Portfolio control room</h1>
            <p>Login to manage portfolio content, resume, certifications, live systems, and future CMS sections.</p>
            <form className="admin-form" onSubmit={handleLogin}>
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
              </label>
              <label>
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
              </label>
              {state.error ? <p className="admin-error">{state.error}</p> : null}
              <button className="btn btn-primary" type="submit">
                <ShieldCheck size={16} /> Login
              </button>
            </form>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section admin-page" data-admin-tab={activeTab}>
      <div className="container">
        <div className="admin-head">
          <div>
            <div className="section-kicker">Admin Dashboard</div>
            <h1>Content ops</h1>
            <p>Logged in as {state.user.email}. Manage fast-changing portfolio content from one private surface.</p>
            {notice ? <p className="admin-notice">{notice}</p> : null}
          </div>
          <div className="actions">
            <button className="btn" type="button" onClick={() => void loadAdminData()}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn" type="button" onClick={() => void handleLogout()}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {adminTabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "is-active" : ""}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-stats" aria-label="Admin content summary">
          <div className="admin-stat">
            <span>Certifications</span>
            <strong>{certifications.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Live Systems</span>
            <strong>{systems.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Contact Links</span>
            <strong>{contacts.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Categories</span>
            <strong>{categories.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Media Assets</span>
            <strong>{mediaAssets.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Projects</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Experiences</span>
            <strong>{experiences.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Music Tracks</span>
            <strong>{musicTracks.length}</strong>
          </div>
          <div className="admin-stat">
            <span>CMS Pages</span>
            <strong>{sitePages.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Articles</span>
            <strong>{articles.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Audit Logs</span>
            <strong>{auditLogs.length}</strong>
          </div>
        </div>

        <div className="admin-overview-actions">
          <a className="btn" href="/api/admin/export" download>
            <Download size={16} /> Export CMS backup
          </a>
          <p>Downloads a JSON snapshot of portfolio CMS data and media references. Uploaded files themselves stay on the server.</p>
        </div>

        <Card className="admin-card-backup admin-overview-backup">
          <div className="admin-card-head">
            <h3><Upload size={18} /> Restore CMS backup</h3>
          </div>
          <p className="admin-muted">
            Import runs in merge mode: matching records are updated, missing records are created, and extra existing records stay untouched.
          </p>
          <div className="admin-upload-control">
            <label className="admin-file-button">
              Choose backup JSON
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setBackupFile(file);
                  setBackupPreview(null);
                }}
              />
            </label>
            <span>
              <strong>{backupFile?.name ?? "No backup selected"}</strong>
              {backupFile ? ` · ${formatBytes(backupFile.size)}` : ""}
            </span>
          </div>
          <div className="actions">
            <button className="btn compact" type="button" disabled={!backupFile || backupImporting} onClick={() => void handlePreviewBackupImport()}>
              <FileText size={15} /> Preview backup
            </button>
            <button className="btn btn-primary compact" type="button" disabled={!backupFile || backupImporting} onClick={() => void handleImportBackup()}>
              <Upload size={15} /> Import merge
            </button>
          </div>
          {backupPreview ? (
            <div className="admin-backup-preview">
              <div>
                <strong>Schema v{backupPreview.schemaVersion}</strong>
                <span>Exported {backupPreview.exportedAt}</span>
              </div>
              <div className="admin-backup-counts">
                {Object.entries(backupPreview.imported ?? backupPreview.counts).map(([key, value]) => (
                  <span key={key}>{key}: {value}</span>
                ))}
              </div>
              {backupPreview.warnings.map((warning) => (
                <p className="admin-help" key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </Card>

        <div className="admin-grid">
          <Card className="admin-card-projects">
            <div className="admin-card-head">
              <h3>{editingProjectId ? "Edit project" : "New project"}</h3>
              {editingProjectId ? (
                <button className="icon-btn" type="button" aria-label="Cancel project edit" onClick={resetProjectForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateProject}>
              <label>
                Title
                <input value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} required />
              </label>
              <label>
                Slug
                <input value={projectForm.slug} onChange={(event) => setProjectForm({ ...projectForm, slug: event.target.value })} placeholder="auto from title if empty" />
              </label>
              <div className="admin-form-pair">
                <AdminSelect label="Category" value={projectForm.category} options={projectCategoryOptions} onChange={(category) => setProjectForm({ ...projectForm, category })} />
                <AdminSelect label="Priority" value={projectForm.priority} options={projectPriorityOptions} onChange={(priority) => setProjectForm({ ...projectForm, priority })} />
              </div>
              <AdminSelect label="Status" value={projectForm.status} options={projectStatusOptions} onChange={(status) => setProjectForm({ ...projectForm, status })} />
              <label>
                Display Order
                <input value={projectForm.sortOrder} onChange={(event) => setProjectForm({ ...projectForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Summary
                <textarea value={projectForm.summary} onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })} required />
              </label>
              <label>
                Problem
                <textarea value={projectForm.problem} onChange={(event) => setProjectForm({ ...projectForm, problem: event.target.value })} required />
              </label>
              <label>
                Solution
                <textarea value={projectForm.solution} onChange={(event) => setProjectForm({ ...projectForm, solution: event.target.value })} required />
              </label>
              <label>
                Roles
                <input value={projectForm.roles} onChange={(event) => setProjectForm({ ...projectForm, roles: event.target.value })} placeholder="Developer, Designer" />
              </label>
              <label>
                Tech Stack
                <input value={projectForm.techStack} onChange={(event) => setProjectForm({ ...projectForm, techStack: event.target.value })} placeholder="React, Vite, Docker" />
              </label>
              <label>
                Learnings
                <input value={projectForm.learnings} onChange={(event) => setProjectForm({ ...projectForm, learnings: event.target.value })} placeholder="Automation, Deployment" />
              </label>
              <label>
                Demo URL
                <input value={projectForm.demoUrl} onChange={(event) => setProjectForm({ ...projectForm, demoUrl: event.target.value })} />
              </label>
              <label>
                GitHub URL
                <input value={projectForm.githubUrl} onChange={(event) => setProjectForm({ ...projectForm, githubUrl: event.target.value })} />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search uploaded images" />
              </label>
              <AdminSelect
                label="Cover Image"
                value={projectForm.coverMediaAssetId}
                placeholder="Use fallback or no cover"
                options={[{ value: "", label: "Use fallback or no cover" }, ...imageMediaOptions]}
                onChange={(coverMediaAssetId) => setProjectForm({ ...projectForm, coverMediaAssetId })}
              />
              <MediaSelectionPreview asset={mediaById.get(projectForm.coverMediaAssetId)} onClear={() => setProjectForm({ ...projectForm, coverMediaAssetId: "" })} />
              <div className="admin-media-picker-field">
                <div>
                  <span>Gallery Images</span>
                  <small>{projectForm.galleryMediaAssetIds.length} selected</small>
                </div>
                <button className="btn" type="button" onClick={() => setMediaPickerTarget("projectGallery")}>
                  Choose Gallery Images
                </button>
              </div>
              {projectForm.galleryMediaAssetIds.length > 0 ? (
                <div className="admin-selected-media-grid">
                  {projectForm.galleryMediaAssetIds.map((id) => (
                    <MediaSelectionPreview
                      asset={mediaById.get(id)}
                      key={id}
                      onClear={() => setProjectForm({ ...projectForm, galleryMediaAssetIds: projectForm.galleryMediaAssetIds.filter((assetId) => assetId !== id) })}
                    />
                  ))}
                </div>
              ) : null}
              <label className="admin-check">
                <input checked={projectForm.isFeatured} onChange={(event) => setProjectForm({ ...projectForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured on home
              </label>
              <label className="admin-check">
                <input checked={projectForm.isPublished} onChange={(event) => setProjectForm({ ...projectForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingProjectId ? "Update Project" : "Add Project"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-projects">
            <h3>Projects</h3>
            <AdminListTools
              label="Search projects"
              value={projectSearch}
              placeholder="Title, category, status, or summary"
              count={filteredProjects.length}
              total={projects.length}
              onChange={setProjectSearch}
            />
            <div className="admin-list">
              {filteredProjects.map((project) => {
                const projectIndex = projects.findIndex((item) => item.id === project.id);
                return (
                  <div className="admin-list-item" key={project.id}>
                    <div>
                      <strong>{project.title}</strong>
                      <span>
                        {project.category} · {project.status}
                      </span>
                      <div className="admin-badges">
                        {project.isFeatured ? <span className="admin-badge">Featured</span> : null}
                        <span className={`admin-badge${project.isPublished ? "" : " is-muted"}`}>{project.isPublished ? "Published" : "Draft"}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <a className="icon-btn" href={`/projects/${project.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`}>
                        <ExternalLink size={15} />
                      </a>
                      <button className="icon-btn" type="button" aria-label={`Move ${project.title} up`} onClick={() => void handleReorderProjects(project.id, "up")} disabled={projectIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${project.title} down`} onClick={() => void handleReorderProjects(project.id, "down")} disabled={projectIndex === projects.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${project.title}`} onClick={() => editProject(project)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${project.title}`} onClick={() => setDeleteTarget({ type: "project", id: project.id, label: project.title })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProjects.length === 0 ? <p className="admin-empty">No projects matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-experiences">
            <div className="admin-card-head">
              <h3>{editingExperienceId ? "Edit experience" : "New experience"}</h3>
              {editingExperienceId ? (
                <button className="icon-btn" type="button" aria-label="Cancel experience edit" onClick={resetExperienceForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateExperience}>
              <label>
                Title
                <input value={experienceForm.title} onChange={(event) => setExperienceForm({ ...experienceForm, title: event.target.value })} required />
              </label>
              <label>
                Slug
                <input value={experienceForm.slug} onChange={(event) => setExperienceForm({ ...experienceForm, slug: event.target.value })} placeholder="auto from title if empty" />
              </label>
              <label>
                Organization
                <input value={experienceForm.organization} onChange={(event) => setExperienceForm({ ...experienceForm, organization: event.target.value })} required />
              </label>
              <div className="admin-form-pair">
                <label>
                  Period
                  <input value={experienceForm.period} onChange={(event) => setExperienceForm({ ...experienceForm, period: event.target.value })} placeholder="2025 - Present" required />
                </label>
                <AdminSelect label="Category" value={experienceForm.category} options={experienceCategoryOptions} onChange={(category) => setExperienceForm({ ...experienceForm, category })} />
              </div>
              <label>
                Display Order
                <input value={experienceForm.sortOrder} onChange={(event) => setExperienceForm({ ...experienceForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Summary
                <textarea value={experienceForm.summary} onChange={(event) => setExperienceForm({ ...experienceForm, summary: event.target.value })} required />
              </label>
              <label>
                Responsibilities
                <input value={experienceForm.responsibilities} onChange={(event) => setExperienceForm({ ...experienceForm, responsibilities: event.target.value })} placeholder="Separated by comma" />
              </label>
              <label>
                Impact
                <input value={experienceForm.impact} onChange={(event) => setExperienceForm({ ...experienceForm, impact: event.target.value })} placeholder="Separated by comma" />
              </label>
              <label>
                Reflection
                <textarea value={experienceForm.reflection} onChange={(event) => setExperienceForm({ ...experienceForm, reflection: event.target.value })} required />
              </label>
              <label>
                Values
                <input value={experienceForm.values} onChange={(event) => setExperienceForm({ ...experienceForm, values: event.target.value })} placeholder="Empathy, Structure, Usefulness" />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search uploaded images" />
              </label>
              <AdminSelect
                label="Cover Image"
                value={experienceForm.coverMediaAssetId}
                placeholder="Use fallback or no cover"
                options={[{ value: "", label: "Use fallback or no cover" }, ...imageMediaOptions]}
                onChange={(coverMediaAssetId) => setExperienceForm({ ...experienceForm, coverMediaAssetId })}
              />
              <MediaSelectionPreview asset={mediaById.get(experienceForm.coverMediaAssetId)} onClear={() => setExperienceForm({ ...experienceForm, coverMediaAssetId: "" })} />
              <div className="admin-media-picker-field">
                <div>
                  <span>Gallery Images</span>
                  <small>{experienceForm.galleryMediaAssetIds.length} selected</small>
                </div>
                <button className="btn" type="button" onClick={() => setMediaPickerTarget("experienceGallery")}>
                  Choose Gallery Images
                </button>
              </div>
              {experienceForm.galleryMediaAssetIds.length > 0 ? (
                <div className="admin-selected-media-grid">
                  {experienceForm.galleryMediaAssetIds.map((id) => (
                    <MediaSelectionPreview
                      asset={mediaById.get(id)}
                      key={id}
                      onClear={() => setExperienceForm({ ...experienceForm, galleryMediaAssetIds: experienceForm.galleryMediaAssetIds.filter((assetId) => assetId !== id) })}
                    />
                  ))}
                </div>
              ) : null}
              <label className="admin-check">
                <input checked={experienceForm.isFeatured} onChange={(event) => setExperienceForm({ ...experienceForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured
              </label>
              <label className="admin-check">
                <input checked={experienceForm.isPublished} onChange={(event) => setExperienceForm({ ...experienceForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingExperienceId ? "Update Experience" : "Add Experience"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-experiences">
            <h3>Experiences</h3>
            <AdminListTools
              label="Search experiences"
              value={experienceSearch}
              placeholder="Title, organization, category, or period"
              count={filteredExperiences.length}
              total={experiences.length}
              onChange={setExperienceSearch}
            />
            <div className="admin-list">
              {filteredExperiences.map((experience) => {
                const experienceIndex = experiences.findIndex((item) => item.id === experience.id);
                return (
                  <div className="admin-list-item" key={experience.id}>
                    <div>
                      <strong>{experience.title}</strong>
                      <span>
                        {experience.category} · {experience.period}
                      </span>
                      <div className="admin-badges">
                        {experience.isFeatured ? <span className="admin-badge">Featured</span> : null}
                        <span className={`admin-badge${experience.isPublished ? "" : " is-muted"}`}>{experience.isPublished ? "Published" : "Draft"}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <a className="icon-btn" href={`/experiences/${experience.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${experience.title}`}>
                        <ExternalLink size={15} />
                      </a>
                      <button className="icon-btn" type="button" aria-label={`Move ${experience.title} up`} onClick={() => void handleReorderExperiences(experience.id, "up")} disabled={experienceIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${experience.title} down`} onClick={() => void handleReorderExperiences(experience.id, "down")} disabled={experienceIndex === experiences.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${experience.title}`} onClick={() => editExperience(experience)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${experience.title}`} onClick={() => setDeleteTarget({ type: "experience", id: experience.id, label: experience.title })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredExperiences.length === 0 ? <p className="admin-empty">No experiences matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-music">
            <div className="admin-card-head">
              <h3>{editingMusicId ? "Edit music track" : "New music track"}</h3>
              {editingMusicId ? (
                <button className="icon-btn" type="button" aria-label="Cancel music edit" onClick={resetMusicForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateMusic}>
              <label>
                Title
                <input value={musicForm.title} onChange={(event) => setMusicForm({ ...musicForm, title: event.target.value })} required />
              </label>
              <label>
                Artist
                <input value={musicForm.artist} onChange={(event) => setMusicForm({ ...musicForm, artist: event.target.value })} required />
              </label>
              <label>
                Note
                <textarea value={musicForm.note} onChange={(event) => setMusicForm({ ...musicForm, note: event.target.value })} required />
              </label>
              <label>
                Display Order
                <input value={musicForm.sortOrder} onChange={(event) => setMusicForm({ ...musicForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search audio or cover files" />
              </label>
              <AdminSelect
                label="Audio File"
                value={musicForm.audioAssetId}
                placeholder="Choose uploaded audio"
                options={[{ value: "", label: "Choose uploaded audio" }, ...audioMediaOptions]}
                onChange={(audioAssetId) => setMusicForm({ ...musicForm, audioAssetId })}
              />
              <MediaSelectionPreview asset={mediaById.get(musicForm.audioAssetId)} onClear={() => setMusicForm({ ...musicForm, audioAssetId: "" })} />
              <AdminSelect
                label="Cover Image"
                value={musicForm.coverAssetId}
                placeholder="Choose uploaded cover"
                options={[{ value: "", label: "Choose uploaded cover" }, ...imageMediaOptions]}
                onChange={(coverAssetId) => setMusicForm({ ...musicForm, coverAssetId })}
              />
              <MediaSelectionPreview asset={mediaById.get(musicForm.coverAssetId)} onClear={() => setMusicForm({ ...musicForm, coverAssetId: "" })} />
              <label className="admin-check">
                <input checked={musicForm.isActive} onChange={(event) => setMusicForm({ ...musicForm, isActive: event.target.checked })} type="checkbox" />
                Active in public playlist
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingMusicId ? "Update Track" : "Add Track"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-music">
            <h3>Music tracks</h3>
            <AdminListTools
              label="Search music"
              value={musicSearch}
              placeholder="Title, artist, note, or audio file"
              count={filteredMusicTracks.length}
              total={musicTracks.length}
              onChange={setMusicSearch}
            />
            <div className="admin-list">
              {filteredMusicTracks.map((track) => {
                const trackIndex = musicTracks.findIndex((item) => item.id === track.id);
                return (
                  <div className="admin-list-item" key={track.id}>
                    <div>
                      <strong>{track.title}</strong>
                      <span>
                        {track.artist}
                        {track.isActive ? " · Active" : " · Hidden"}
                        {track.audioOriginalName ? ` · ${track.audioOriginalName}` : " · No audio"}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button className="icon-btn" type="button" aria-label={`Move ${track.title} up`} onClick={() => void handleReorderMusic(track.id, "up")} disabled={trackIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${track.title} down`} onClick={() => void handleReorderMusic(track.id, "down")} disabled={trackIndex === musicTracks.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${track.title}`} onClick={() => editMusic(track)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${track.title}`} onClick={() => setDeleteTarget({ type: "music", id: track.id, label: track.title })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredMusicTracks.length === 0 ? <p className="admin-empty">No music tracks matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-resume-media">
            <div className="admin-card-head">
              <h3>Resume manager</h3>
              <FileText size={18} />
            </div>
            <form className="admin-form" onSubmit={handleCreateResume}>
              <label>
                Label
                <input value={resumeForm.label} onChange={(event) => setResumeForm({ ...resumeForm, label: event.target.value })} placeholder="CV June 2026" />
              </label>
              <label>
                Notes
                <input value={resumeForm.notes} onChange={(event) => setResumeForm({ ...resumeForm, notes: event.target.value })} placeholder="Optional internal note" />
              </label>
              <AdminFilePicker
                label="CV PDF"
                accept="application/pdf"
                files={resumeFile ? [resumeFile] : []}
                placeholder="PDF only"
                onChange={(files) => setResumeFile(files[0] ?? null)}
                onClear={() => setResumeFile(null)}
              />
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Upload size={16} /> Upload and Activate CV
              </button>
            </form>
          </Card>

          <Card className="admin-card-resume-media">
            <h3>Resume versions</h3>
            <AdminListTools
              label="Search resumes"
              value={resumeSearch}
              placeholder="Label, note, or PDF filename"
              count={filteredResumeVersions.length}
              total={resumeVersions.length}
              onChange={setResumeSearch}
            />
            <div className="admin-list">
              {filteredResumeVersions.map((resume) => (
                <div className="admin-list-item" key={resume.id}>
                  <div>
                    <strong>{resume.label}</strong>
                    <span>
                      {resume.mediaAsset?.originalName ?? "No media attached"}
                      {resume.isActive ? " · Active" : ""}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    {resume.mediaAsset?.publicUrl ? (
                      <a className="icon-btn" href={resume.mediaAsset.publicUrl} target="_blank" rel="noreferrer" aria-label={`Open ${resume.label}`}>
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                    <button className="icon-btn" type="button" aria-label={`Activate ${resume.label}`} onClick={() => void handleActivateResume(resume.id)} disabled={resume.isActive || saving}>
                      <CheckCircle size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredResumeVersions.length === 0 ? <p className="admin-empty">No resume versions matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-resume-media">
            <div className="admin-card-head">
              <h3>{editingMediaId ? "Edit media details" : "Media upload"}</h3>
              {editingMediaId ? (
                <button className="icon-btn" type="button" aria-label="Cancel edit" onClick={resetMediaForm}>
                  <X size={15} />
                </button>
              ) : (
                <Upload size={18} />
              )}
            </div>
            {editingMediaId ? (
              <form className="admin-form" onSubmit={handleUpdateMedia}>
                <label>
                  Alt Text
                  <input value={mediaForm.altText} onChange={(e) => setMediaForm({ ...mediaForm, altText: e.target.value })} placeholder="Describe the image..." />
                </label>
                <label>
                  Caption
                  <input value={mediaForm.caption} onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })} placeholder="Visible text below media..." />
                </label>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  <Pencil size={16} /> Save Changes
                </button>
              </form>
            ) : (
              <form className="admin-form" onSubmit={handleUploadMedia}>
                <AdminFilePicker
                  label="Files"
                  accept="image/*,application/pdf,audio/*,video/mp4"
                  files={mediaFiles}
                  multiple
                  placeholder="Images, PDF, audio, or video. Batch upload supported."
                  onChange={setMediaFiles}
                  onClear={() => setMediaFiles([])}
                />
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  <Upload size={16} /> Upload {mediaFiles.length > 1 ? `${mediaFiles.length} Files` : "Media"}
                </button>
              </form>
            )}
          </Card>

          <Card className="admin-card-resume-media">
            <div className="admin-card-head">
              <h3>Media library</h3>
            </div>
            <AdminListTools
              label="Search media"
              value={mediaSearch}
              placeholder="Search image, PDF, audio, or video"
              count={filteredMediaAssets.length}
              total={mediaAssets.length}
              onChange={setMediaSearch}
            />
            <div className="admin-list">
              {filteredMediaAssets.map((asset) => (
                <div className="admin-list-item" key={asset.id}>
                  <div>
                    <strong>{asset.originalName}</strong>
                    <span>
                      {asset.mimeType} · {formatBytes(asset.sizeBytes)}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <a className="icon-btn" href={asset.publicUrl} target="_blank" rel="noreferrer" aria-label={`Open ${asset.originalName}`}>
                      <ExternalLink size={15} />
                    </a>
                    <button className="icon-btn" type="button" aria-label={`Edit ${asset.originalName}`} onClick={() => editMedia(asset)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${asset.originalName}`} onClick={() => setDeleteTarget({ type: "media", id: asset.id, label: asset.originalName })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredMediaAssets.length === 0 ? <p className="admin-empty">No media matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-certifications">
            <div className="admin-card-head">
              <h3>{editingCertificationId ? "Edit certification" : "New certification"}</h3>
              {editingCertificationId ? (
                <button className="icon-btn" type="button" aria-label="Cancel certification edit" onClick={resetCertificationForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateCertification}>
              <label>
                Title
                <input value={certForm.title} onChange={(event) => setCertForm({ ...certForm, title: event.target.value })} required />
              </label>
              <label>
                Issuer
                <input value={certForm.issuer} onChange={(event) => setCertForm({ ...certForm, issuer: event.target.value })} required />
              </label>
              <label>
                Issued at
                <input value={certForm.issuedAt} onChange={(event) => setCertForm({ ...certForm, issuedAt: event.target.value })} placeholder="Jun 2026" required />
              </label>
              <label>
                Expires at
                <input value={certForm.expiresAt} onChange={(event) => setCertForm({ ...certForm, expiresAt: event.target.value })} placeholder="May 2029" />
              </label>
              <label>
                Credential URL
                <input value={certForm.credentialUrl} onChange={(event) => setCertForm({ ...certForm, credentialUrl: event.target.value })} />
              </label>
              <label>
                Skills
                <input value={certForm.skills} onChange={(event) => setCertForm({ ...certForm, skills: event.target.value })} placeholder="Android, Kotlin, ML" />
              </label>
              <label>
                Display Order
                <input value={certForm.sortOrder} onChange={(event) => setCertForm({ ...certForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={certForm.isFeatured} onChange={(event) => setCertForm({ ...certForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingCertificationId ? "Update Certification" : "Add Certification"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-certifications">
            <h3>Certifications</h3>
            <AdminListTools
              label="Search certifications"
              value={certificationSearch}
              placeholder="Title, issuer, skill, or issued date"
              count={filteredCertifications.length}
              total={certifications.length}
              onChange={setCertificationSearch}
            />
            <div className="admin-list">
              {filteredCertifications.map((certification) => {
                const certificationIndex = certifications.findIndex((item) => item.id === certification.id);
                return (
                  <div className="admin-list-item" key={certification.id}>
                    <div>
                      <strong>{certification.title}</strong>
                      <span>{certification.issuer} · {certification.issuedAt}</span>
                      <div className="admin-badges">
                        {certification.isFeatured ? <span className="admin-badge">Featured</span> : null}
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      {certification.credentialUrl ? (
                        <a className="icon-btn" href={certification.credentialUrl} target="_blank" rel="noreferrer" aria-label={`Open ${certification.title}`}>
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                      <button className="icon-btn" type="button" aria-label={`Move ${certification.title} up`} onClick={() => void handleReorderCertifications(certification.id, "up")} disabled={certificationIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${certification.title} down`} onClick={() => void handleReorderCertifications(certification.id, "down")} disabled={certificationIndex === certifications.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${certification.title}`} onClick={() => editCertification(certification)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${certification.title}`} onClick={() => setDeleteTarget({ type: "certification", id: certification.id, label: certification.title })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredCertifications.length === 0 ? <p className="admin-empty">No certifications matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-systems">
            <div className="admin-card-head">
              <h3>{editingSystemId ? "Edit live system" : "New live system"}</h3>
              {editingSystemId ? (
                <button className="icon-btn" type="button" aria-label="Cancel system edit" onClick={resetSystemForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateSystem}>
              <label>
                Title
                <input value={systemForm.title} onChange={(event) => setSystemForm({ ...systemForm, title: event.target.value })} required />
              </label>
              <label>
                Description
                <textarea value={systemForm.description} onChange={(event) => setSystemForm({ ...systemForm, description: event.target.value })} required />
              </label>
              <label>
                URL
                <input value={systemForm.url} onChange={(event) => setSystemForm({ ...systemForm, url: event.target.value })} required />
              </label>
              <label>
                Embed URL
                <input value={systemForm.embedUrl} onChange={(event) => setSystemForm({ ...systemForm, embedUrl: event.target.value })} />
              </label>
              <label>
                Display Order
                <input value={systemForm.sortOrder} onChange={(event) => setSystemForm({ ...systemForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={systemForm.isEmbeddable} onChange={(event) => setSystemForm({ ...systemForm, isEmbeddable: event.target.checked })} type="checkbox" />
                Embeddable
              </label>
              <label className="admin-check">
                <input checked={systemForm.isPublished} onChange={(event) => setSystemForm({ ...systemForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingSystemId ? "Update System" : "Add System"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-systems">
            <h3>Live systems</h3>
            <AdminListTools
              label="Search systems"
              value={systemSearch}
              placeholder="Title, URL, description, or embed"
              count={filteredSystems.length}
              total={systems.length}
              onChange={setSystemSearch}
            />
            <div className="admin-list">
              {filteredSystems.map((system) => {
                const systemIndex = systems.findIndex((item) => item.id === system.id);
                return (
                  <div className="admin-list-item" key={system.id}>
                    <div>
                      <strong>{system.title}</strong>
                      <span>{system.url}</span>
                      <div className="admin-badges">
                        <span className={`admin-badge${system.isPublished ? "" : " is-muted"}`}>{system.isPublished ? "Published" : "Draft"}</span>
                        {system.isEmbeddable ? <span className="admin-badge">Embeddable</span> : null}
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <a className="icon-btn" href={system.url} target="_blank" rel="noreferrer" aria-label={`Open ${system.title}`}>
                        <ExternalLink size={15} />
                      </a>
                      <button className="icon-btn" type="button" aria-label={`Move ${system.title} up`} onClick={() => void handleReorderSystems(system.id, "up")} disabled={systemIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${system.title} down`} onClick={() => void handleReorderSystems(system.id, "down")} disabled={systemIndex === systems.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${system.title}`} onClick={() => editSystem(system)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${system.title}`} onClick={() => setDeleteTarget({ type: "system", id: system.id, label: system.title })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredSystems.length === 0 ? <p className="admin-empty">No live systems matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-core-nodes">
            <div className="admin-card-head">
              <h3>{editingCoreNodeId ? "Edit core node" : "New core node"}</h3>
              {editingCoreNodeId ? (
                <button className="icon-btn" type="button" aria-label="Cancel core node edit" onClick={resetCoreNodeForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateCoreNode}>
              <label>
                Label
                <input value={coreNodeForm.label} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, label: event.target.value })} required />
              </label>
              <label>
                Description
                <textarea value={coreNodeForm.description} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, description: event.target.value })} required />
              </label>
              <label>
                Href
                <input value={coreNodeForm.href} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, href: event.target.value })} required />
              </label>
              <div className="admin-form-pair">
                <label>
                  Position X (%)
                  <input value={coreNodeForm.positionX} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, positionX: Number(event.target.value) })} type="number" step="0.1" required />
                </label>
                <label>
                  Position Y (%)
                  <input value={coreNodeForm.positionY} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, positionY: Number(event.target.value) })} type="number" step="0.1" required />
                </label>
              </div>
              <label>
                Display Order
                <input value={coreNodeForm.sortOrder} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={coreNodeForm.isPublished} onChange={(event) => setCoreNodeForm({ ...coreNodeForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingCoreNodeId ? "Update Core Node" : "Add Core Node"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-core-nodes">
            <h3>Core nodes</h3>
            <AdminListTools
              label="Search core nodes"
              value={coreNodeSearch}
              placeholder="Label, description, or href"
              count={filteredCoreNodes.length}
              total={coreNodes.length}
              onChange={setCoreNodeSearch}
            />
            <div className="admin-list">
              {filteredCoreNodes.map((node) => {
                const nodeIndex = coreNodes.findIndex((item) => item.id === node.id);
                return (
                  <div className="admin-list-item" key={node.id}>
                    <div>
                      <strong>{node.label}</strong>
                      <span>{node.href} · X: {node.positionX} Y: {node.positionY}</span>
                      <div className="admin-badges">
                        <span className={`admin-badge${node.isPublished ? "" : " is-muted"}`}>{node.isPublished ? "Published" : "Draft"}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <button className="icon-btn" type="button" aria-label={`Move ${node.label} up`} onClick={() => void handleReorderCoreNodes(node.id, "up")} disabled={nodeIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${node.label} down`} onClick={() => void handleReorderCoreNodes(node.id, "down")} disabled={nodeIndex === coreNodes.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${node.label}`} onClick={() => editCoreNode(node)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${node.label}`} onClick={() => setDeleteTarget({ type: "coreNode", id: node.id, label: node.label })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredCoreNodes.length === 0 ? <p className="admin-empty">No core nodes matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-contacts">
            <div className="admin-card-head">
              <h3>{editingContactId ? "Edit contact link" : "New contact link"}</h3>
              {editingContactId ? (
                <button className="icon-btn" type="button" aria-label="Cancel contact edit" onClick={resetContactForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateContact}>
              <AdminSelect label="Type" value={contactForm.type} options={contactTypeOptions} onChange={(type) => setContactForm({ ...contactForm, type })} />
              <label>
                Label
                <input value={contactForm.label} onChange={(event) => setContactForm({ ...contactForm, label: event.target.value })} required />
              </label>
              <label>
                Value
                <input value={contactForm.value} onChange={(event) => setContactForm({ ...contactForm, value: event.target.value })} placeholder="Shown text, optional" />
              </label>
              <label>
                URL
                <input value={contactForm.url} onChange={(event) => setContactForm({ ...contactForm, url: event.target.value })} required />
              </label>
              <label>
                Display Order
                <input value={contactForm.sortOrder} onChange={(event) => setContactForm({ ...contactForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={contactForm.isPrimary} onChange={(event) => setContactForm({ ...contactForm, isPrimary: event.target.checked })} type="checkbox" />
                Primary
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingContactId ? "Update Contact" : "Add Contact"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-contacts">
            <h3>Contact links</h3>
            <AdminListTools
              label="Search contacts"
              value={contactSearch}
              placeholder="Label, type, value, or URL"
              count={filteredContacts.length}
              total={contacts.length}
              onChange={setContactSearch}
            />
            <div className="admin-list">
              {filteredContacts.map((contact) => {
                const contactIndex = contacts.findIndex((item) => item.id === contact.id);
                return (
                  <div className="admin-list-item" key={contact.id}>
                    <div>
                      <strong>{contact.label}</strong>
                      <span>{contact.url}</span>
                      <div className="admin-badges">
                        <span className="admin-badge">{contact.type}</span>
                        {contact.isPrimary ? <span className="admin-badge">Primary</span> : null}
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <a className="icon-btn" href={contact.url} target="_blank" rel="noreferrer" aria-label={`Open ${contact.label}`}>
                        <ExternalLink size={15} />
                      </a>
                      <button className="icon-btn" type="button" aria-label={`Move ${contact.label} up`} onClick={() => void handleReorderContact(contact.id, "up")} disabled={contactIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${contact.label} down`} onClick={() => void handleReorderContact(contact.id, "down")} disabled={contactIndex === contacts.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${contact.label}`} onClick={() => editContact(contact)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${contact.label}`} onClick={() => setDeleteTarget({ type: "contact", id: contact.id, label: contact.label })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredContacts.length === 0 ? <p className="admin-empty">No contact links matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-categories">
            <div className="admin-card-head">
              <h3>{editingCategoryId ? "Edit category" : "New category"}</h3>
              {editingCategoryId ? (
                <button className="icon-btn" type="button" aria-label="Cancel category edit" onClick={resetCategoryForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateCategory}>
              <AdminSelect
                label="Content Area"
                value={categoryForm.scope}
                options={categoryScopeOptions}
                onChange={(scope) => setCategoryForm({ ...categoryForm, scope: scope as ContentCategoryScope })}
              />
              <label>
                Label
                <input value={categoryForm.label} onChange={(event) => setCategoryForm({ ...categoryForm, label: event.target.value })} placeholder="Technical Note" required />
              </label>
              <label>
                Slug
                <input value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} placeholder="auto from label if empty" />
              </label>
              <label>
                Description
                <textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Internal note for this category" />
              </label>
              <label>
                Display Order
                <input value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={categoryForm.isActive} onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })} type="checkbox" />
                Active in dropdowns
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingCategoryId ? "Update Category" : "Add Category"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-categories">
            <h3>Categories</h3>
            <div className="admin-search-row">
              <input
                id="category-search"
                className="admin-search"
                type="search"
                placeholder="Search label, slug, or scope"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
              />
              <div className="admin-select-inline">
                <AdminSelect
                  label="Scope"
                  value={categoryScopeFilter}
                  options={[{ value: "", label: "All areas" }, ...categoryScopeOptions]}
                  placeholder="All areas"
                  onChange={(scope) => setCategoryScopeFilter(scope as ContentCategoryScope | "")}
                />
              </div>
              <span className="admin-count">{filteredCategories.length} of {categories.length}</span>
            </div>
            <div className="admin-list">
              {filteredCategories.map((category) => {
                const scopedCategories = categories.filter((item) => item.scope === category.scope);
                const categoryIndex = scopedCategories.findIndex((item) => item.id === category.id);
                return (
                  <div className="admin-list-item" key={category.id}>
                    <div>
                      <strong>{category.label}</strong>
                      <span>{categoryScopeLabel(category.scope)} · {category.slug}</span>
                      <div className="admin-badges">
                        <span className={`admin-badge${category.isActive ? "" : " is-muted"}`}>{category.isActive ? "Active" : "Hidden"}</span>
                        <span className="admin-badge">{category.usageCount} used</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <button className="icon-btn" type="button" aria-label={`Move ${category.label} up`} onClick={() => void handleReorderCategories(category.id, "up")} disabled={categoryIndex === 0 || saving}>
                        <ArrowUp size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Move ${category.label} down`} onClick={() => void handleReorderCategories(category.id, "down")} disabled={categoryIndex === scopedCategories.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </button>
                      <button className="icon-btn" type="button" aria-label={`Edit ${category.label}`} onClick={() => editCategory(category)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" type="button" aria-label={`Delete ${category.label}`} onClick={() => setDeleteTarget({ type: "category", id: category.id, label: category.label })}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredCategories.length === 0 ? <p className="admin-empty">No categories matched this search.</p> : null}
            </div>
          </Card>

          <Card className="admin-card-pages">
            <div className="admin-card-head">
              <h3>{editingPageSectionKey ? "Edit page copy" : "Choose page copy"}</h3>
              {editingPageSectionKey ? (
                <button className="icon-btn" type="button" aria-label="Cancel page section edit" onClick={resetPageSectionForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            {pageOptions.length > 0 ? (
              <AdminSelect
                label="Page"
                value={selectedSitePage?.slug ?? selectedPageSlug}
                options={pageOptions}
                onChange={(slug) => {
                  setSelectedPageSlug(slug);
                  resetPageSectionForm();
                }}
              />
            ) : (
              <p className="admin-empty">No CMS pages found. Run the seed once to create Home and Lead Self copy.</p>
            )}
            <form className="admin-form" onSubmit={handleUpdatePageSection}>
              <label>
                Section Key
                <input value={pageSectionForm.key} disabled />
              </label>
              <label>
                Kicker / Subtitle
                <input value={pageSectionForm.subtitle} onChange={(event) => setPageSectionForm({ ...pageSectionForm, subtitle: event.target.value })} />
              </label>
              <label>
                Title
                <textarea value={pageSectionForm.title} onChange={(event) => setPageSectionForm({ ...pageSectionForm, title: event.target.value })} />
              </label>
              <label>
                Body
                <textarea className="admin-copy-textarea" value={pageSectionForm.body} onChange={(event) => setPageSectionForm({ ...pageSectionForm, body: event.target.value })} />
                <span className="admin-help">Use blank lines to separate paragraphs. Frontend keeps static fallback if this section is unavailable.</span>
              </label>
              <div className="admin-form-row">
                <AlignmentSelect
                  label="Title Alignment"
                  value={pageSectionForm.titleAlign}
                  onChange={(titleAlign) => setPageSectionForm({ ...pageSectionForm, titleAlign })}
                />
                <AlignmentSelect
                  label="Body Alignment"
                  value={pageSectionForm.bodyAlign}
                  onChange={(bodyAlign) => setPageSectionForm({ ...pageSectionForm, bodyAlign })}
                />
              </div>
              <div className="admin-field-group">
                <div className="admin-field-group-head">
                  <strong>Section Media</strong>
                  <span>Used by sections like Home empathy, Lead Self intro, and Core Server.</span>
                </div>
                <label>
                  Image Key
                  <input value={pageSectionForm.imageKey} onChange={(event) => setPageSectionForm({ ...pageSectionForm, imageKey: event.target.value })} placeholder="profile, pldVolunteer, coreServer" />
                  <span className="admin-help">Static fallback key. Choosing uploaded media overrides this value.</span>
                </label>
                <div className="admin-media-picker-field">
                  <div>
                    <span>Bound Media</span>
                    <small>{pageSectionForm.mediaAssetId ? mediaById.get(pageSectionForm.mediaAssetId)?.originalName ?? "Selected media" : "No image selected"}</small>
                  </div>
                  <button className="icon-btn" type="button" aria-label="Choose section image" onClick={() => setMediaPickerTarget("pageSectionImage")}>
                    <FileText size={15} />
                  </button>
                </div>
                <MediaSelectionPreview
                  asset={pageSectionForm.mediaAssetId ? mediaById.get(pageSectionForm.mediaAssetId) : undefined}
                  onClear={() => setPageSectionForm({ ...pageSectionForm, mediaAssetId: "", imageUrl: "" })}
                />
              </div>
              <div className="admin-field-group">
                <div className="admin-field-group-head">
                  <strong>CTA / Link Labels</strong>
                  <span>Leave empty when the selected section has no button.</span>
                </div>
                <div className="admin-form-row">
                  <label>
                    CTA Label
                    <input value={pageSectionForm.ctaLabel} onChange={(event) => setPageSectionForm({ ...pageSectionForm, ctaLabel: event.target.value })} placeholder="Explore My Projects" />
                  </label>
                  <label>
                    CTA Href
                    <input value={pageSectionForm.ctaHref} onChange={(event) => setPageSectionForm({ ...pageSectionForm, ctaHref: event.target.value })} placeholder="/projects" />
                  </label>
                </div>
                <div className="admin-form-row">
                  <label>
                    Primary Label
                    <input value={pageSectionForm.primaryCtaLabel} onChange={(event) => setPageSectionForm({ ...pageSectionForm, primaryCtaLabel: event.target.value })} placeholder="Explore My Story" />
                  </label>
                  <label>
                    Primary Href
                    <input value={pageSectionForm.primaryCtaHref} onChange={(event) => setPageSectionForm({ ...pageSectionForm, primaryCtaHref: event.target.value })} placeholder="/#story" />
                  </label>
                </div>
                <div className="admin-form-row">
                  <label>
                    Secondary Label
                    <input value={pageSectionForm.secondaryCtaLabel} onChange={(event) => setPageSectionForm({ ...pageSectionForm, secondaryCtaLabel: event.target.value })} placeholder="View Projects" />
                  </label>
                  <label>
                    Secondary Href
                    <input value={pageSectionForm.secondaryCtaHref} onChange={(event) => setPageSectionForm({ ...pageSectionForm, secondaryCtaHref: event.target.value })} placeholder="/projects or resume" />
                  </label>
                </div>
                <div className="admin-form-row">
                  <label>
                    Tertiary Label
                    <input value={pageSectionForm.tertiaryCtaLabel} onChange={(event) => setPageSectionForm({ ...pageSectionForm, tertiaryCtaLabel: event.target.value })} placeholder="Contact Me" />
                  </label>
                  <label>
                    Tertiary Href
                    <input value={pageSectionForm.tertiaryCtaHref} onChange={(event) => setPageSectionForm({ ...pageSectionForm, tertiaryCtaHref: event.target.value })} placeholder="/contact" />
                  </label>
                </div>
              </div>
              <label>
                Display Order
                <input value={pageSectionForm.sortOrder} onChange={(event) => setPageSectionForm({ ...pageSectionForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={pageSectionForm.isPublished} onChange={(event) => setPageSectionForm({ ...pageSectionForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving || !editingPageSectionKey}>
                <Plus size={16} /> Update Section Copy
              </button>
            </form>
            {selectedPageSection ? (
              <div className="admin-block-editor">
                <div className="admin-card-head">
                  <h3>
                    {selectedSectionSupportsCards
                      ? editingPageBlockId
                        ? "Edit section card"
                        : "Add section card"
                      : "Section cards unavailable"}
                  </h3>
                  {editingPageBlockId && selectedSectionSupportsCards ? (
                    <button className="icon-btn" type="button" aria-label="Cancel block edit" onClick={resetPageBlockForm}>
                      <X size={15} />
                    </button>
                  ) : null}
                </div>
                {selectedSectionSupportsCards ? (
                  <form className="admin-form" onSubmit={handleSavePageBlock}>
                    <label>
                      Card Title
                      <input value={pageBlockForm.title} onChange={(event) => setPageBlockForm({ ...pageBlockForm, title: event.target.value })} placeholder="Card heading" required />
                    </label>
                    <label>
                      Card Text
                      <textarea value={pageBlockForm.text} onChange={(event) => setPageBlockForm({ ...pageBlockForm, text: event.target.value })} placeholder="Short supporting text" required />
                    </label>
                    <label>
                      Image Key
                      <input value={pageBlockForm.imageKey} onChange={(event) => setPageBlockForm({ ...pageBlockForm, imageKey: event.target.value })} placeholder="Optional, e.g. earlySilat" />
                      <span className="admin-help">Static fallback key. Choosing media below will override this image on the frontend.</span>
                    </label>
                    <div className="admin-media-picker-field">
                      <div>
                        <span>Bound Media</span>
                        <small>{pageBlockForm.mediaAssetId ? mediaById.get(pageBlockForm.mediaAssetId)?.originalName ?? "Selected media" : "No image selected"}</small>
                      </div>
                      <button className="icon-btn" type="button" aria-label="Choose block image" onClick={() => setMediaPickerTarget("pageBlockImage")}>
                        <FileText size={15} />
                      </button>
                    </div>
                    <MediaSelectionPreview
                      asset={pageBlockForm.mediaAssetId ? mediaById.get(pageBlockForm.mediaAssetId) : undefined}
                      onClear={() => setPageBlockForm({ ...pageBlockForm, mediaAssetId: "", imageUrl: "" })}
                    />
                    <label>
                      Display Order
                      <input value={pageBlockForm.sortOrder} onChange={(event) => setPageBlockForm({ ...pageBlockForm, sortOrder: Number(event.target.value) })} type="number" />
                    </label>
                    <label className="admin-check">
                      <input checked={pageBlockForm.isPublished} onChange={(event) => setPageBlockForm({ ...pageBlockForm, isPublished: event.target.checked })} type="checkbox" />
                      Published
                    </label>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      <Plus size={16} /> {editingPageBlockId ? "Update Card" : "Add Card"}
                    </button>
                  </form>
                ) : (
                  <p className="admin-help">
                    This section does not render repeatable cards on the public page. Use Section Media and CTA fields above, or delete any cards that were created here by mistake.
                  </p>
                )}
                <div className="admin-list">
                  {selectedPageSection.blocks.map((block, index) => (
                    <div className="admin-list-item" key={block.id}>
                      <div>
                        <strong>{blockField(block, "title") || "Untitled card"}</strong>
                        <span>{blockField(block, "text")}</span>
                        <div className="admin-badges">
                          <span className="admin-badge">{block.type}</span>
                          <span className={`admin-badge${block.isPublished ? "" : " is-muted"}`}>{block.isPublished ? "Published" : "Draft"}</span>
                          {blockField(block, "imageUrl") ? <span className="admin-badge">Media bound</span> : null}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        {selectedSectionSupportsCards ? (
                          <>
                            <button className="icon-btn" type="button" aria-label="Move block up" onClick={() => void handleReorderPageBlock(block.id, "up")} disabled={index === 0 || saving}>
                              <ArrowUp size={15} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Move block down" onClick={() => void handleReorderPageBlock(block.id, "down")} disabled={index === selectedPageSection.blocks.length - 1 || saving}>
                              <ArrowDown size={15} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Edit block" onClick={() => editPageBlock(block)}>
                              <Pencil size={15} />
                            </button>
                          </>
                        ) : null}
                        <button
                          className="icon-btn danger"
                          type="button"
                          aria-label="Delete block"
                          onClick={() => setDeleteTarget({ type: "pageBlock", id: block.id, label: blockField(block, "title") || "Untitled card", pageSlug: selectedSitePage?.slug ?? selectedPageSlug, sectionKey: selectedPageSection.key })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedPageSection.blocks.length === 0 ? <p className="admin-empty">No cards in this section yet.</p> : null}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="admin-card-pages">
            <div className="admin-card-head">
              <h3>{selectedSitePage?.title ?? "CMS Pages"}</h3>
              {selectedSitePage ? (
                <a className="icon-btn" href={publicPagePath(selectedSitePage.slug)} target="_blank" rel="noreferrer" aria-label={`Preview ${selectedSitePage.title}`}>
                  <ExternalLink size={15} />
                </a>
              ) : null}
            </div>
            {selectedSitePage ? (
              <div className="actions admin-preview-actions">
                <a className="btn" href={publicPagePath(selectedSitePage.slug)} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} /> Preview {selectedSitePage.title}
                </a>
              </div>
            ) : null}
            <div className="admin-list">
              {selectedSitePage?.sections.map((section) => (
                <div className="admin-list-item" key={section.id}>
                  <div>
                    <strong>{section.title || section.key}</strong>
                    <span>
                      {section.key}
                      {section.subtitle ? ` · ${section.subtitle}` : ""}
                    </span>
                    <div className="admin-badges">
                      <span className={`admin-badge${section.isPublished ? "" : " is-muted"}`}>{section.isPublished ? "Published" : "Draft"}</span>
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Edit ${section.key}`} onClick={() => editPageSection(section)}>
                      <Pencil size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {selectedSitePage && selectedSitePage.sections.length === 0 ? <p className="admin-empty">No sections found for this page.</p> : null}
            </div>
          </Card>
        {/* ─── Articles Tab ─────────────────────────────────────────────────── */}
          <Card className="admin-card-articles">
            <div className="admin-card-head">
              <h3>{editingArticleId ? "Edit Article" : "New Article"}</h3>
              <div className="admin-row-actions">
                <button className="btn compact" type="button" onClick={() => setArticleGeneratorOpen(true)} disabled={saving}>
                  <Sparkles size={14} /> Generate Draft
                </button>
                {editingArticleId ? (
                  <>
                    <a className="icon-btn" href={`/articles/${articleForm.slug}`} target="_blank" rel="noreferrer" aria-label="Preview article">
                      <ExternalLink size={15} />
                    </a>
                    <button className="icon-btn" type="button" aria-label="Cancel article edit" onClick={resetArticleForm}>
                      <X size={15} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {articleLocalDraft ? (
              <div className="article-local-draft">
                <div>
                  <strong>Local draft available</strong>
                  <span>
                    Saved {formatAuditDate(articleLocalDraft.savedAt)}
                    {articleLocalDraft.articleForm.title ? ` · ${articleLocalDraft.articleForm.title}` : ""}
                  </span>
                  {articleAutosaveNotice ? <span>{articleAutosaveNotice}</span> : null}
                </div>
                <div className="admin-row-actions">
                  <button className="btn compact" type="button" onClick={restoreArticleLocalDraft}>
                    <History size={14} /> Restore
                  </button>
                  <button className="icon-btn" type="button" aria-label="Discard local article draft" onClick={clearArticleLocalDraft}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : articleAutosaveNotice ? (
              <p className="admin-help">{articleAutosaveNotice}</p>
            ) : null}

            <form className="admin-form" onSubmit={handleSaveArticle} id="article-form">
              <label>
                Title
                <input
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="Article title"
                />
              </label>
              <label>
                Slug
                <input
                  value={articleForm.slug}
                  onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                  placeholder="auto-generated from title if empty"
                />
              </label>
              <label>
                Subtitle
                <input
                  value={articleForm.subtitle}
                  onChange={(e) => setArticleForm({ ...articleForm, subtitle: e.target.value })}
                  placeholder="Optional subtitle / tagline"
                />
              </label>
              <label>
                Excerpt <span style={{ color: "var(--muted-2)", fontSize: 12 }}>(shown in cards)</span>
                <textarea
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  rows={3}
                />
              </label>
              <div className="admin-form-pair">
                <AdminSelect label="Category" value={articleForm.category} options={articleCategoryOptions} onChange={(category) => setArticleForm({ ...articleForm, category })} />
                <AdminSelect label="Status" value={articleForm.status} options={articleStatusOptions} onChange={(status) => setArticleForm({ ...articleForm, status })} />
              </div>
              <label>
                Tags <span style={{ color: "var(--muted-2)", fontSize: 12 }}>(comma-separated)</span>
                <input
                  value={articleForm.tags}
                  onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                  placeholder="n8n, Automation, Android"
                />
              </label>
              <label>
                Author Name
                <input
                  value={articleForm.authorName}
                  onChange={(e) => setArticleForm({ ...articleForm, authorName: e.target.value })}
                />
              </label>
              <label>
                Author Role
                <input
                  value={articleForm.authorRole}
                  onChange={(e) => setArticleForm({ ...articleForm, authorRole: e.target.value })}
                  placeholder="e.g. TELADAN Scholar · Universitas Brawijaya"
                />
              </label>

              {/* Cover image */}
              <div className="admin-form-field">
                <span className="admin-form-label">Cover Image</span>
                <div className="admin-form-media-row">
                  {articleForm.coverAssetId ? (
                    <div className="admin-media-thumb">
                      <img src={mediaById.get(articleForm.coverAssetId)?.publicUrl ?? ""} alt="cover" />
                      <button className="icon-btn danger" type="button" aria-label="Remove cover" onClick={() => setArticleForm({ ...articleForm, coverAssetId: "" })}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn" type="button" onClick={() => setMediaPickerTarget("articleCover")}>
                      Choose from media library
                    </button>
                  )}
                </div>
              </div>

              {/* SEO */}
              <details>
                <summary className="admin-seo-toggle">SEO (optional)</summary>
                <div className="admin-form-nested">
                  <label>
                    SEO Title
                    <input value={articleForm.seoTitle} onChange={(e) => setArticleForm({ ...articleForm, seoTitle: e.target.value })} />
                  </label>
                  <label>
                    SEO Description
                    <textarea value={articleForm.seoDescription} onChange={(e) => setArticleForm({ ...articleForm, seoDescription: e.target.value })} rows={2} />
                  </label>
                </div>
              </details>

              <GeneratorMetaPanel value={articleForm.generatorMeta} />

              <label className="admin-checkbox-label">
                <input type="checkbox" checked={articleForm.isFeatured} onChange={(e) => setArticleForm({ ...articleForm, isFeatured: e.target.checked })} />
                Featured article
              </label>

              {/* Block Editor */}
              <div className="article-block-editor">
                <div className="article-block-editor-head">
                  <strong>Content Blocks</strong>
                  <span className="admin-badge">{articleBlocks.length} block{articleBlocks.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Block list with DnD */}
                <div className="article-block-list">
                  {articleBlocks.map((block, index) => {
                    const thumbnail = articleBlockThumbnail(block);

                    return (
                      <div key={block.id} className="article-block-row-shell">
                        <div
                          className={`article-block-row${dragOverBlockIdx === index ? " is-drag-over" : ""}${editingBlockIdx === index ? " is-editing" : ""}`}
                          draggable
                          onDragStart={(e) => handleBlockDragStart(e, index)}
                          onDragOver={(e) => handleBlockDragOver(e, index)}
                          onDrop={(e) => handleBlockDrop(e, index)}
                          onDragEnd={handleBlockDragEnd}
                        >
                          <button className="block-drag-handle" type="button" aria-label="Drag to reorder" tabIndex={-1}>
                            <GripVertical size={15} />
                          </button>
                          <div className={`block-row-info${thumbnail ? " has-thumb" : ""}`}>
                            {thumbnail ? <img className="article-block-thumb" src={thumbnail} alt="" loading="lazy" /> : null}
                            <div className="block-row-copy">
                              <span className="admin-badge">{articleBlockLabel(block)}</span>
                              <span className="block-row-preview">{articleBlockPreview(block)}</span>
                            </div>
                          </div>
                          <div className="admin-row-actions">
                            <button className="icon-btn" type="button" aria-label="Move block up" onClick={() => moveArticleBlock(index, "up")} disabled={index === 0}>
                              <ArrowUp size={14} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Move block down" onClick={() => moveArticleBlock(index, "down")} disabled={index === articleBlocks.length - 1}>
                              <ArrowDown size={14} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Insert block after this block" onClick={() => prepareInsertAfterBlock(index)}>
                              <Plus size={14} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Duplicate block" onClick={() => duplicateBlock(index)}>
                              <Copy size={14} />
                            </button>
                            <button className="icon-btn" type="button" aria-label="Edit block" onClick={() => startEditBlock(index)}>
                              <Pencil size={14} />
                            </button>
                            <button className="icon-btn danger" type="button" aria-label="Delete block" onClick={() => deleteBlock(index)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {insertAfterBlockIdx === index && !addingBlockType ? (
                          <div className="article-block-type-picker is-inline">
                            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>Insert after #{index + 1}:</span>
                            {articleBlockTypes.map((type) => (
                              <button key={type} className="article-block-type-btn" type="button" onClick={() => addBlock(type, index)}>
                                <Plus size={12} /> {type}
                              </button>
                            ))}
                            <button className="article-block-type-btn muted" type="button" onClick={() => setInsertAfterBlockIdx(null)}>
                              <X size={12} /> cancel
                            </button>
                          </div>
                        ) : null}
                        {insertAfterBlockIdx === index && addingBlockType ? (
                          <div className="article-block-edit-form is-inline">
                            <div className="admin-card-head">
                              <span className="admin-badge">{addingBlockType} · after #{index + 1}</span>
                              <button className="icon-btn" type="button" aria-label="Cancel add block" onClick={() => { setAddingBlockType(null); setInsertAfterBlockIdx(null); setBlockDraftForm({}); }}>
                                <X size={14} />
                              </button>
                            </div>
                            <BlockDraftForm
                              type={addingBlockType}
                              value={blockDraftForm}
                              onChange={setBlockDraftForm}
                              imageAssets={imageMediaAssets}
                            />
                            <button className="btn btn-primary" type="button" onClick={saveBlockDraft}>
                              <Plus size={15} /> Add Block
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {articleBlocks.length === 0 && (
                    <p className="admin-empty">No blocks yet. Add content below.</p>
                  )}
                </div>

                {/* Edit existing block */}
                {editingBlockIdx !== null && (
                  <div className="article-block-edit-form">
                    <div className="admin-card-head">
                      <span className="admin-badge">{articleBlocks[editingBlockIdx]?.type}</span>
                      <button className="icon-btn" type="button" aria-label="Cancel block edit" onClick={() => { setEditingBlockIdx(null); setBlockDraftForm({}); }}>
                        <X size={14} />
                      </button>
                    </div>
                    <BlockDraftForm
                      type={articleBlocks[editingBlockIdx]?.type ?? "paragraph"}
                      value={blockDraftForm}
                      onChange={setBlockDraftForm}
                      imageAssets={imageMediaAssets}
                    />
                    <button className="btn btn-primary" type="button" onClick={updateBlockDraft}>
                      <Check size={15} /> Update Block
                    </button>
                  </div>
                )}

                {/* Add new block */}
                {addingBlockType && insertAfterBlockIdx === null ? (
                  <div className="article-block-edit-form">
                    <div className="admin-card-head">
                      <span className="admin-badge">
                        {addingBlockType}{insertAfterBlockIdx !== null ? ` · after #${insertAfterBlockIdx + 1}` : ""}
                      </span>
                      <button className="icon-btn" type="button" aria-label="Cancel add block" onClick={() => { setAddingBlockType(null); setInsertAfterBlockIdx(null); setBlockDraftForm({}); }}>
                        <X size={14} />
                      </button>
                    </div>
                    <BlockDraftForm
                      type={addingBlockType}
                      value={blockDraftForm}
                      onChange={setBlockDraftForm}
                      imageAssets={imageMediaAssets}
                    />
                    <button className="btn btn-primary" type="button" onClick={saveBlockDraft}>
                      <Plus size={15} /> Add Block
                    </button>
                  </div>
                ) : insertAfterBlockIdx === null ? (
                  <div className="article-block-type-picker">
                    <span style={{ fontSize: 12, color: "var(--muted-2)" }}>
                      Add block:
                    </span>
                    {articleBlockTypes.map((type) => (
                      <button key={type} className="article-block-type-btn" type="button" onClick={() => addBlock(type, insertAfterBlockIdx)}>
                        <Plus size={12} /> {type}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="admin-form-actions">
                <button className="btn" type="button" disabled={saving} onClick={() => void saveArticle(true)}>
                  <Check size={15} /> {saving ? "Saving…" : "Save & keep editing"}
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving} form="article-form">
                  {saving ? "Saving…" : editingArticleId ? "Update Article" : "Create Article"}
                </button>
              </div>
            </form>
          </Card>

          <Card className="admin-card-article-preview">
            <div className="admin-card-head">
              <div>
                <h3>Article Sandbox</h3>
                <p className="admin-help">Live preview from the current editor draft. Save only when it feels right.</p>
              </div>
              <div className="admin-row-actions">
                {(["reader", "desktop", "mobile"] as ArticlePreviewMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`btn compact${articlePreviewMode === mode ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setArticlePreviewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className={`article-preview-frame mode-${articlePreviewMode}`}>
              <article className="article-preview-document">
                <header className="article-preview-header">
                  <div className="article-meta">
                    <span className="article-badge article-badge-category">{articleForm.category || "Category"}</span>
                    <span>{articleForm.status || "draft"}</span>
                    <span>{articlePreviewReadingTime} min read</span>
                  </div>
                  <h1 className="article-title">{articleForm.title || "Untitled article"}</h1>
                  {articleForm.subtitle ? <p className="article-subtitle">{articleForm.subtitle}</p> : null}
                  <p className="article-preview-author">
                    By <strong>{articleForm.authorName || "Oktavianus Samuel"}</strong>
                    {articleForm.authorRole ? <span> · {articleForm.authorRole}</span> : null}
                  </p>
                </header>

                {articlePreviewCover ? (
                  <figure className="article-preview-cover">
                    <img src={articlePreviewCover.publicUrl} alt={articlePreviewCover.altText || articleForm.title || "Article cover"} />
                  </figure>
                ) : null}

                <ArticleContent blocks={articlePreviewBlocks} emptyCopy="Add content blocks to preview the article body." />

                {articlePreviewTags.length > 0 ? (
                  <footer className="article-footer">
                    <div className="article-footer-tags">
                      {articlePreviewTags.map((tag) => (
                        <span key={tag} className="article-card-tag">{tag}</span>
                      ))}
                    </div>
                  </footer>
                ) : null}
              </article>
            </div>
          </Card>

          <Card className="admin-card-articles-list">
            <div className="admin-card-head">
              <h3>Articles</h3>
              <span className="admin-badge">{articles.length}</span>
            </div>

            {/* Filters */}
            <div className="admin-search-row">
              <input
                id="article-search"
                className="admin-search"
                type="search"
                placeholder="Search articles…"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />
              <div className="admin-select-inline">
                <AdminSelect
                  label="Status"
                  value={articleStatusFilter}
                  onChange={setArticleStatusFilter}
                  options={[{ value: "", label: "All statuses" }, ...articleStatusOptions]}
                  placeholder="All statuses"
                />
              </div>
            </div>

            <div className="admin-list">
              {articles
                .filter((a) => {
                  const q = articleSearch.toLowerCase().trim();
                  const matchSearch = !q || `${a.title} ${a.excerpt} ${a.category} ${a.tags.join(" ")}`.toLowerCase().includes(q);
                  const matchStatus = !articleStatusFilter || a.status === articleStatusFilter;
                  return matchSearch && matchStatus;
                })
                .map((article) => (
                  <div className="admin-list-item" key={article.id}>
                    <div>
                      <strong>{article.title}</strong>
                      <span>{article.excerpt.slice(0, 80)}{article.excerpt.length > 80 ? "…" : ""}</span>
                      <div className="admin-badges">
                        <span className="admin-badge">{article.category}</span>
                        <span className={`admin-badge${article.status === "published" ? "" : " is-muted"}`}>{article.status}</span>
                        {article.isFeatured && <span className="admin-badge"><Star size={10} /> Featured</span>}
                        <span className="admin-badge">{article.readingTime}m read</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      {article.status === "published" ? (
                        <a className="icon-btn" href={`/articles/${article.slug}`} target="_blank" rel="noreferrer" aria-label="Preview">
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      {article.status === "published" ? (
                        <button className="icon-btn" type="button" aria-label="Unpublish" onClick={() => void handlePublishArticle(article.id, false)} disabled={saving}>
                          <BookOpen size={14} />
                        </button>
                      ) : (
                        <button className="icon-btn" type="button" aria-label="Publish" onClick={() => void handlePublishArticle(article.id, true)} disabled={saving}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button className="icon-btn" type="button" aria-label="Duplicate" onClick={() => void handleDuplicateArticle(article.id)} disabled={saving}>
                        <FileText size={14} />
                      </button>
                      <button className="icon-btn" type="button" aria-label="Edit" onClick={() => editArticle(article)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn danger"
                        type="button"
                        aria-label="Delete article"
                        onClick={() => setDeleteTarget({ type: "article", id: article.id, label: article.title })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              {articles.length === 0 && <p className="admin-empty">No articles yet. Create your first one!</p>}
            </div>
          </Card>
        </div>

        {/* ─── Contexts Tab ─────────────────────────────────────────────────── */}
        <div className={`admin-grid${activeTab === "contexts" ? "" : " admin-hidden"}`}>
          <Card className="admin-card-contexts">
            <div className="admin-card-head">
              <div>
                <h3>Chatbot Context</h3>
                <p className="admin-help">Live portfolio context is generated from CMS, projects, experiences, resume, and contacts. Add manual notes only for extra nuance.</p>
              </div>
              <a className="icon-btn" href="/api/public/portfolio-context.md" target="_blank" rel="noreferrer" aria-label="Open public chatbot context">
                <ExternalLink size={15} />
              </a>
            </div>
            <form
              className="admin-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveContext("portfolio");
              }}
            >
              <AdminSelect
                label="Edit Mode"
                value={contextMode.portfolio}
                options={[
                  { value: "append", label: "Dynamic + Manual Notes" },
                  { value: "override", label: "Full Inline Override" },
                ]}
                onChange={(mode) => setContextEditMode("portfolio", mode as "append" | "override")}
              />
              {contextMode.portfolio === "override" ? (
                <p className="admin-help">
                  Override mode uses this editor as the full chatbot context. It will not automatically include future CMS changes until you load/regenerate the context again.
                </p>
              ) : (
                <p className="admin-help">
                  Dynamic mode keeps CMS data live and appends your notes after the generated portfolio context.
                </p>
              )}
              <label>
                {contextMode.portfolio === "override" ? "Full Chatbot Context" : "Manual Notes"}
                <textarea
                  className="admin-copy-textarea admin-context-textarea"
                  value={contextForm.portfolio}
                  onChange={(event) => setContextForm((current) => ({ ...current, portfolio: event.target.value }))}
                  placeholder={contextMode.portfolio === "override" ? "Edit the complete chatbot context inline." : "Extra chatbot context that should be appended to generated portfolio data."}
                  rows={10}
                />
              </label>
              <div className="actions">
                <button className="btn compact" type="button" onClick={() => loadFinalContextIntoEditor("portfolio")}>
                  Load Current Final Context
                </button>
              </div>
              <details open>
                <summary className="admin-seo-toggle">Preview current chatbot context</summary>
                <pre className="admin-context-preview">{contexts?.portfolio.finalMarkdown ?? "Context has not loaded yet."}</pre>
              </details>
              <details>
                <summary className="admin-seo-toggle">Generated web context only</summary>
                <pre className="admin-context-preview">{contexts?.portfolio.generatedMarkdown ?? "Context has not loaded yet."}</pre>
              </details>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Check size={15} /> Save Chatbot Context
              </button>
            </form>
          </Card>

          <Card className="admin-card-contexts">
            <div className="admin-card-head">
              <div>
                <h3>Article Generator Context</h3>
                <p className="admin-help">This context guides Gemini's writing style. It is automatically sent by the backend when generating drafts.</p>
              </div>
              <a className="icon-btn" href="/api/public/article-context.md" target="_blank" rel="noreferrer" aria-label="Open public article context">
                <ExternalLink size={15} />
              </a>
            </div>
            <form
              className="admin-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveContext("article");
              }}
            >
              <AdminSelect
                label="Edit Mode"
                value={contextMode.article}
                options={[
                  { value: "append", label: "Default Guide + Manual Notes" },
                  { value: "override", label: "Full Inline Override" },
                ]}
                onChange={(mode) => setContextEditMode("article", mode as "append" | "override")}
              />
              {contextMode.article === "override" ? (
                <p className="admin-help">
                  Override mode uses this editor as the full article generator context. Default writing guide changes will not be included automatically.
                </p>
              ) : (
                <p className="admin-help">
                  Dynamic mode keeps the default writing guide and appends your extra style rules.
                </p>
              )}
              <label>
                {contextMode.article === "override" ? "Full Article Generator Context" : "Manual Writing Notes"}
                <textarea
                  className="admin-copy-textarea admin-context-textarea"
                  value={contextForm.article}
                  onChange={(event) => setContextForm((current) => ({ ...current, article: event.target.value }))}
                  placeholder={contextMode.article === "override" ? "Edit the complete article generator context inline." : "Extra writing style rules, preferred phrases, article examples, or constraints."}
                  rows={10}
                />
              </label>
              <div className="actions">
                <button className="btn compact" type="button" onClick={() => loadFinalContextIntoEditor("article")}>
                  Load Current Final Context
                </button>
              </div>
              <details open>
                <summary className="admin-seo-toggle">Preview current article generator context</summary>
                <pre className="admin-context-preview">{contexts?.article.finalMarkdown ?? "Context has not loaded yet."}</pre>
              </details>
              <details>
                <summary className="admin-seo-toggle">Default writing guide only</summary>
                <pre className="admin-context-preview">{contexts?.article.generatedMarkdown ?? "Context has not loaded yet."}</pre>
              </details>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Check size={15} /> Save Article Context
              </button>
            </form>
          </Card>
        </div>

        {/* ─── Theme Tab ────────────────────────────────────────────────────── */}
        <div className={`admin-grid${activeTab === "theme" ? "" : " admin-hidden"}`}>
          <Card className="admin-card-theme">
            <div className="admin-card-head">
              <h3><Palette size={18} /> Theme Studio</h3>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Customize color, reading width, spacing, and typography tokens. Preview applies locally; save keeps it for visitors.
            </p>
            <form className="admin-form theme-form" onSubmit={handleSaveTheme} id="theme-form">
              <div className="theme-preset-row">
                {themePresets.map((preset) => (
                  <button
                    key={preset.label}
                    className="btn compact"
                    type="button"
                    onClick={() => applyThemePreset(preset.label === "Default" ? themeDefaults : preset.values)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="theme-color-grid">
                {themeColorKeys.map(({ key, label }) => (
                  <div key={key} className="theme-color-row">
                    <div className="theme-color-swatch" style={{ background: themeForm[key] ?? themeDefaults[key] ?? "#000" }} aria-hidden="true" />
                    <label>
                      {label}
                      <input
                        id={`theme-color-${key}`}
                        type="color"
                        value={themeForm[key] ?? themeDefaults[key] ?? "#000000"}
                        onChange={(e) => setThemeForm({ ...themeForm, [key]: e.target.value })}
                      />
                      <input
                        type="text"
                        value={themeForm[key] ?? themeDefaults[key] ?? ""}
                        onChange={(e) => setThemeForm({ ...themeForm, [key]: e.target.value })}
                        placeholder="#000000"
                        maxLength={7}
                        className="theme-hex-input"
                      />
                    </label>
                    {themeForm[key] !== themeDefaults[key] && themeForm[key] ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Reset ${label} to default`}
                        onClick={() => setThemeForm({ ...themeForm, [key]: themeDefaults[key] ?? "" })}
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="theme-control-grid">
                {themeControlKeys.map((control) => (
                  <div className="theme-control-row" key={control.key}>
                    <AdminSelect
                      label={control.label}
                      value={themeForm[control.key] ?? themeDefaults[control.key] ?? ""}
                      options={control.options}
                      onChange={(value) => setThemeForm({ ...themeForm, [control.key]: value })}
                    />
                    {themeForm[control.key] !== themeDefaults[control.key] && themeForm[control.key] ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Reset ${control.label} to default`}
                        onClick={() => setThemeForm({ ...themeForm, [control.key]: themeDefaults[control.key] ?? "" })}
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="actions" style={{ marginTop: 20 }}>
                <button className="btn" type="button" onClick={handlePreviewTheme} disabled={themeSaving}>
                  Preview
                </button>
                <button className="btn btn-primary" type="submit" disabled={themeSaving}>
                  {themeSaving ? "Saving…" : "Save Theme"}
                </button>
                <button className="btn" type="button" onClick={() => void handleResetTheme()} disabled={themeSaving}>
                  Reset to Defaults
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className={`admin-grid${activeTab === "security" ? "" : " admin-hidden"}`}>
          <Card className="admin-card-security">
            <div className="admin-card-head">
              <h3><KeyRound size={18} /> Admin Security</h3>
            </div>
            <p className="admin-muted">
              Change the admin password from the control room. Saving rotates active sessions so old tokens stop working.
            </p>
            <form className="admin-form" onSubmit={handleChangePassword}>
              <label>
                Current Password
                <input
                  autoComplete="current-password"
                  value={securityForm.currentPassword}
                  onChange={(event) => setSecurityForm({ ...securityForm, currentPassword: event.target.value })}
                  required
                  type="password"
                />
              </label>
              <label>
                New Password
                <input
                  autoComplete="new-password"
                  minLength={10}
                  value={securityForm.newPassword}
                  onChange={(event) => setSecurityForm({ ...securityForm, newPassword: event.target.value })}
                  required
                  type="password"
                />
              </label>
              <label>
                Confirm New Password
                <input
                  autoComplete="new-password"
                  minLength={10}
                  value={securityForm.confirmPassword}
                  onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })}
                  required
                  type="password"
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <ShieldCheck size={15} /> Update Password
              </button>
            </form>
          </Card>
          <Card className="admin-card-security">
            <div className="admin-card-head">
              <h3><ShieldCheck size={18} /> Session Safety</h3>
            </div>
            <div className="admin-security-notes">
              <p><strong>Current account</strong>{state.user.email}</p>
              <p><strong>Session rotation</strong>Password updates create a fresh session and revoke previous admin sessions.</p>
              <p><strong>Audit trail</strong>Password changes are recorded in Recent Admin Activity without storing secret values.</p>
            </div>
          </Card>
        </div>

        <div className={`admin-grid${activeTab === "audit" ? "" : " admin-hidden"}`}>
          <Card className="admin-card-audit">
            <div className="admin-card-head">
              <h3><History size={18} /> Recent Admin Activity</h3>
              <button className="btn btn-compact" type="button" onClick={() => void loadAdminData()}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <p className="admin-muted">
              Shows the last 50 tracked CMS actions. This is a lightweight safety trail, not a full version history.
            </p>
            <div className="admin-list">
              {auditLogs.length === 0 ? <p className="admin-empty">No tracked admin activity yet.</p> : null}
              {auditLogs.map((log) => (
                <div className="admin-list-item admin-audit-item" key={log.id}>
                  <div>
                    <strong>{log.entityLabel || log.entityType}</strong>
                    <span>{log.action} {log.entityType} by {log.actorEmail || "system"} · {formatAuditDate(log.createdAt)}</span>
                    <div className="admin-badges">
                      <span>{log.entityType}</span>
                      <span>{log.action}</span>
                      {log.entityId ? <span>{log.entityId.slice(0, 8)}</span> : null}
                    </div>
                    {log.metadata ? (
                      <details className="admin-audit-details">
                        <summary>Metadata</summary>
                        <pre className="admin-context-preview">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="actions with-space">
          <Button to="/">Back to portfolio</Button>

        </div>
      </div>
      {articleGeneratorOpen ? (
        <ArticleGeneratorModal
          value={articleGeneratorForm}
          categories={articleCategoryOptions}
          imageAssets={imageMediaAssets}
          saving={saving}
          onChange={setArticleGeneratorForm}
          onCancel={() => setArticleGeneratorOpen(false)}
          onSubmit={() => void handleGenerateArticleDraft()}
        />
      ) : null}
      {mediaPickerTarget ? (
        <GalleryMediaPickerModal
          title={
            mediaPickerTarget === "projectGallery"
              ? "Choose project gallery images"
              : mediaPickerTarget === "experienceGallery"
                ? "Choose experience gallery images"
                : mediaPickerTarget === "pageSectionImage"
                  ? "Choose section image"
                  : mediaPickerTarget === "articleCover"
                    ? "Choose article cover image"
                    : "Choose section card image"
          }
          assets={imageMediaAssets}
          selectedIds={
            mediaPickerTarget === "projectGallery"
              ? projectForm.galleryMediaAssetIds
              : mediaPickerTarget === "experienceGallery"
                ? experienceForm.galleryMediaAssetIds
                : mediaPickerTarget === "pageSectionImage"
                  ? pageSectionForm.mediaAssetId
                    ? [pageSectionForm.mediaAssetId]
                    : []
                  : mediaPickerTarget === "articleCover"
                    ? articleForm.coverAssetId
                      ? [articleForm.coverAssetId]
                      : []
                    : pageBlockForm.mediaAssetId
                    ? [pageBlockForm.mediaAssetId]
                    : []
          }
          multiple={mediaPickerTarget === "projectGallery" || mediaPickerTarget === "experienceGallery"}
          saving={saving}
          onCancel={() => setMediaPickerTarget(null)}
          onSave={handleSaveGallerySelection}
        />
      ) : null}
      {deleteTarget ? <DeleteConfirmModal target={deleteTarget} saving={saving} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} /> : null}
    </section>
  );
}
