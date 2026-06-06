import { ArrowLeft, ArrowRight, BookOpen, Calendar, Link as LinkIcon, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi, type PublicArticle, type PublicArticleBlock } from "../lib/publicApi";
import { ArticleCard } from "../components/ArticleCard";

// ─── Block Renderer ───────────────────────────────────────────────────────────

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
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
  return { __html: html };
}

function ArticleGalleryBlock({
  images,
  layout,
}: {
  images: { src: string; alt?: string; caption?: string }[];
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

function BlockRenderer({ block }: { block: PublicArticleBlock }) {
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
      const images = (c["images"] as { src: string; alt?: string; caption?: string }[]) || [];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticle | null>(null);
  const [related, setRelated] = useState<PublicArticle[]>([]);
  const [articleIndex, setArticleIndex] = useState<{ previous: PublicArticle | null; next: PublicArticle | null }>({ previous: null, next: null });
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setArticle(null);
    setRelated([]);
    setArticleIndex({ previous: null, next: null });
    setLinkCopied(false);

    publicApi
      .article(slug)
      .then(({ data }) => {
        setArticle(data);
        document.title = data.seoTitle ? `${data.seoTitle} — Oktavianus Samuel` : `${data.title} — Oktavianus Samuel`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement("meta");
          metaDesc.setAttribute("name", "description");
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute("content", data.seoDescription || data.excerpt);

        // Load related and article navigation from the public article index.
        return Promise.all([
          publicApi.articles({ category: data.category, limit: "4" }),
          publicApi.articles(),
        ]).then(([sameCategory, allArticles]) => {
          setRelated(sameCategory.data.filter((a) => a.slug !== slug).slice(0, 3));
          const currentIndex = allArticles.data.findIndex((item) => item.slug === slug);
          setArticleIndex({
            previous: currentIndex > 0 ? allArticles.data[currentIndex - 1] : null,
            next: currentIndex >= 0 && currentIndex < allArticles.data.length - 1 ? allArticles.data[currentIndex + 1] : null,
          });
        });
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));

    return () => {
      // Clean up meta description on unmount
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", "Portfolio of Oktavianus Samuel Minarto");
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="article-detail-section">
        <div className="container" style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px" }}>
          <div className="skeleton" style={{ height: 40, width: "70%", marginBottom: 16, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 24, width: "40%", marginBottom: 40, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 300, width: "100%", marginBottom: 40, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 16, width: "100%", marginBottom: 12, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: "95%", marginBottom: 12, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: "98%", marginBottom: 12, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 40, borderRadius: 4 }} />
          
          <div className="skeleton" style={{ height: 16, width: "95%", marginBottom: 12, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 16, width: "90%", marginBottom: 12, borderRadius: 4 }} />
        </div>
      </section>
    );
  }

  const tableOfContents = article?.blocks
    .filter((block) => block.type === "heading")
    .map((block) => {
      const content = getBlockContent<Record<string, unknown>>(block);
      return {
        id: headingAnchor(block),
        text: String(content["text"] ?? ""),
        level: typeof content["level"] === "number" ? content["level"] : 2,
      };
    })
    .filter((item) => item.text.trim().length > 0) ?? [];

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      setLinkCopied(false);
    }
  }

  if (notFound || !article) {
    return (
      <section className="article-detail-section">
        <div className="container">
          <div className="articles-empty" data-reveal>
            <BookOpen size={36} />
            <p>Article not found.</p>
            <Link to="/articles" className="btn btn-primary" style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Articles
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <article className="article-detail-section">
      {/* Back nav */}
      <div className="container">
        <div className="article-detail-back" data-reveal style={{ marginBottom: 40, marginTop: -20 }}>
          <Link to="/articles" className="btn" style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 16px" }}>
            <ArrowLeft size={16} /> Notes &amp; Reflections
          </Link>
        </div>
      </div>

      {/* Hero */}
      <header className="article-header">
        <div className="container">
          <div className="article-meta" data-reveal style={{ marginBottom: 24 }}>
            <span className="article-badge article-badge-category">{article.category}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} />
              {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={14} />
              {article.readingTime} min read
            </span>
          </div>

          <h1 className="article-title" data-reveal>
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="article-subtitle" data-reveal>
              {article.subtitle}
            </p>
          )}

          <p data-reveal style={{ color: "var(--muted-2)", fontSize: "0.95rem" }}>
            By <strong style={{ color: "var(--text)" }}>{article.author.name}</strong>
            {article.author.role && <span> · {article.author.role}</span>}
          </p>

          <div className="article-header-actions" data-reveal>
            <button className="btn compact" type="button" onClick={() => void handleCopyLink()}>
              <LinkIcon size={15} /> {linkCopied ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>
      </header>

      {/* Cover image */}
      {article.coverImage && (
        <div className="container">
          <div className="article-hero-image" data-reveal>
            <img src={article.coverImage} alt={article.coverAlt || article.title} />
          </div>
        </div>
      )}

      {/* Body */}
      {tableOfContents.length > 1 && (
        <nav className="article-toc" aria-label="Article table of contents" data-reveal>
          <span>In this note</span>
          <div>
            {tableOfContents.map((item) => (
              <a key={item.id} className={`level-${item.level}`} href={`#${item.id}`}>
                {item.text}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="article-content" data-reveal>
        {article.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}

        {article.blocks.length === 0 && (
          <p className="article-block-paragraph" style={{ color: "var(--muted-2)" }}>
            No content yet.
          </p>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <footer className="article-footer" data-reveal>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted-2)" }}>
            <Tag size={15} />
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tags</span>
          </div>
          <div className="article-footer-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="article-card-tag">
                {tag}
              </span>
            ))}
          </div>
        </footer>
      )}

      {(articleIndex.previous || articleIndex.next) && (
        <nav className="article-next-prev" aria-label="Article navigation" data-reveal>
          {articleIndex.previous ? (
            <Link to={`/articles/${articleIndex.previous.slug}`} className="article-nav-card">
              <span><ArrowLeft size={14} /> Previous</span>
              <strong>{articleIndex.previous.title}</strong>
            </Link>
          ) : <span />}
          {articleIndex.next ? (
            <Link to={`/articles/${articleIndex.next.slug}`} className="article-nav-card align-right">
              <span>Next <ArrowRight size={14} /></span>
              <strong>{articleIndex.next.title}</strong>
            </Link>
          ) : <span />}
        </nav>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="article-related" style={{ marginTop: 80 }}>
          <div className="container">
            <div className="section-kicker" data-reveal>
              More from {article.category}
            </div>
            <div className="articles-grid" data-reveal style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="container article-detail-cta" data-reveal>
        <div className="thin-divider" />
        <div className="actions centered">
          <Link to="/articles" className="btn btn-primary">
            <ArrowLeft size={16} /> All Articles
          </Link>
          <Link to="/projects" className="btn">
            View Projects
          </Link>
        </div>
      </div>
    </article>
  );
}
