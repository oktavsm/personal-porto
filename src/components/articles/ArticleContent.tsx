import { useEffect, useRef, useState } from "react";
import type { PublicArticleBlock } from "../../lib/publicApi";

type ArticleImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export type ArticleTocItem = {
  id: string;
  text: string;
  level: number;
};

function getBlockContent<T extends Record<string, unknown>>(block: PublicArticleBlock): T {
  return (block.contentJson && typeof block.contentJson === "object" && !Array.isArray(block.contentJson)
    ? (block.contentJson as T)
    : {}) as T;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isSafeMarkdownHref(value: string) {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(value.trim());
}

function parseMarkdown(text: string) {
  const html = escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) => {
      if (!isSafeMarkdownHref(href)) return label;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
  return { __html: html };
}

function ArticleGalleryBlock({
  images,
  layout,
}: {
  images: ArticleImage[];
  layout: string;
}) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (layout !== "carousel" || images.length < 2 || isPaused) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      const node = galleryRef.current;
      if (!node) return;

      const firstItem = node.querySelector<HTMLElement>(".gallery-item");
      const step = firstItem ? firstItem.offsetWidth + 16 : node.clientWidth * 0.86;
      const nearEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - step * 0.35;

      node.scrollTo({
        left: nearEnd ? 0 : node.scrollLeft + step,
        behavior: "smooth",
      });
    }, 3600);

    return () => window.clearInterval(interval);
  }, [images.length, isPaused, layout]);

  return (
    <div
      className={`article-block-gallery layout-${layout}`}
      ref={galleryRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {images.map((img, i) => (
        <figure key={`${img.src}-${i}`} className="gallery-item">
          <img src={img.src} alt={img.alt || ""} />
          {img.caption && <figcaption className="article-block-caption">{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function headingAnchor(block: PublicArticleBlock) {
  const content = getBlockContent<Record<string, unknown>>(block);
  const text = String(content["text"] ?? "");
  return `heading-${slugifyHeading(text) || block.id}`;
}

export function getArticleTableOfContents(blocks: PublicArticleBlock[]) {
  return blocks
    .filter((block) => block.type === "heading")
    .map((block) => {
      const content = getBlockContent<Record<string, unknown>>(block);
      return {
        id: headingAnchor(block),
        text: String(content["text"] ?? ""),
        level: typeof content["level"] === "number" ? content["level"] : 2,
      };
    })
    .filter((item) => item.text.trim().length > 0);
}

export function ArticleBlockRenderer({ block }: { block: PublicArticleBlock }) {
  const c = getBlockContent<Record<string, unknown>>(block);
  const align = ["left", "center", "right", "justify"].includes(String(c["align"]))
    ? String(c["align"])
    : undefined;
  const alignStyle = align ? { textAlign: align as "left" | "center" | "right" | "justify" } : undefined;

  switch (block.type) {
    case "paragraph":
      return <p className="article-block-paragraph" style={alignStyle} dangerouslySetInnerHTML={parseMarkdown(String(c["text"] ?? ""))} />;

    case "heading": {
      const level = typeof c["level"] === "number" ? c["level"] : 2;
      const text = String(c["text"] ?? "");
      const id = headingAnchor(block);
      if (level === 2) return <h2 className="article-block-heading-2" id={id} style={alignStyle}>{text}</h2>;
      if (level === 4) return <h4 className="article-block-heading-4" id={id} style={alignStyle}>{text}</h4>;
      return <h3 className="article-block-heading-3" id={id} style={alignStyle}>{text}</h3>;
    }

    case "image": {
      const src = String(c["src"] ?? "");
      const alt = String(c["alt"] ?? "");
      const caption = c["caption"] ? String(c["caption"]) : null;
      const layout = String(c["layout"] ?? "inline");
      return (
        <figure className={`article-block-image layout-${layout}`}>
          <img src={src} alt={alt} />
          {caption && <figcaption className="article-block-caption">{caption}</figcaption>}
        </figure>
      );
    }

    case "gallery": {
      const images = (c["images"] as ArticleImage[]) || [];
      const layout = String(c["layout"] ?? "grid");
      return <ArticleGalleryBlock images={images} layout={layout} />;
    }

    case "quote": {
      const text = String(c["text"] ?? "");
      const source = c["source"] ? String(c["source"]) : null;
      return (
        <blockquote className="article-block-quote">
          <p className="article-block-quote-text" dangerouslySetInnerHTML={parseMarkdown(`"${text}"`)} />
          {source && <cite className="article-block-quote-source">{source}</cite>}
        </blockquote>
      );
    }

    case "callout": {
      const variant = String(c["variant"] ?? "note");
      const title = c["title"] ? String(c["title"]) : null;
      const text = String(c["text"] ?? "");
      const labelMap: Record<string, string> = {
        note: "Note",
        reflection: "Reflection",
        learning: "What I Learned",
        warning: "Heads Up",
      };
      return (
        <aside className={`article-block-callout variant-${variant}`}>
          <span className="callout-label" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>{labelMap[variant] ?? "Note"}</span>
          {title && <h4 className="callout-title">{title}</h4>}
          <div dangerouslySetInnerHTML={parseMarkdown(text)} />
        </aside>
      );
    }

    case "list": {
      const items = Array.isArray(c["items"]) ? (c["items"] as string[]) : [];
      const style = String(c["style"] ?? "bullet");
      if (style === "number" || style === "numbered") {
        return (
          <ol className="article-block-list">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={parseMarkdown(item)} />
            ))}
          </ol>
        );
      }
      return (
        <ul className="article-block-list">
          {items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={parseMarkdown(item)} />
          ))}
        </ul>
      );
    }

    case "code": {
      const code = String(c["code"] ?? "");
      const lang = c["language"] ? String(c["language"]) : null;
      return (
        <div className="article-block-code">
          {lang && <div className="article-block-code-lang">{lang}</div>}
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    case "divider":
      return <hr className="article-block-divider" />;

    default:
      return null;
  }
}

export function ArticleContent({ blocks, emptyCopy = "No content yet." }: { blocks: PublicArticleBlock[]; emptyCopy?: string }) {
  return (
    <div className="article-content" data-reveal>
      {blocks.map((block) => (
        <ArticleBlockRenderer key={block.id} block={block} />
      ))}

      {blocks.length === 0 && (
        <p className="article-block-paragraph" style={{ color: "var(--muted-2)" }}>
          {emptyCopy}
        </p>
      )}
    </div>
  );
}
