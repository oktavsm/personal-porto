import { ArrowLeft, BookOpen, Calendar, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi, type PublicArticle, type PublicArticleBlock } from "../lib/publicApi";
import { ArticleCard } from "../components/ArticleCard";

// ─── Block Renderer ───────────────────────────────────────────────────────────

function getBlockContent<T extends Record<string, unknown>>(block: PublicArticleBlock): T {
  return (block.contentJson && typeof block.contentJson === "object" && !Array.isArray(block.contentJson)
    ? (block.contentJson as T)
    : {}) as T;
}

function BlockRenderer({ block }: { block: PublicArticleBlock }) {
  const c = getBlockContent<Record<string, unknown>>(block);

  switch (block.type) {
    case "paragraph":
      return <p className="article-block-paragraph">{String(c["text"] ?? "")}</p>;

    case "heading": {
      const level = typeof c["level"] === "number" ? c["level"] : 2;
      const text = String(c["text"] ?? "");
      if (level === 2) return <h2 className="article-block-heading-2">{text}</h2>;
      return <h3 className="article-block-heading-3">{text}</h3>;
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

    case "quote": {
      const text = String(c["text"] ?? "");
      const source = c["source"] ? String(c["source"]) : null;
      return (
        <blockquote className="article-block-quote">
          <p className="article-block-quote-text">&#8220;{text}&#8221;</p>
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
          <div>{text}</div>
        </aside>
      );
    }

    case "list": {
      const items = Array.isArray(c["items"]) ? (c["items"] as string[]) : [];
      const style = String(c["style"] ?? "bullet");
      if (style === "numbered") {
        return (
          <ol className="article-block-list">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="article-block-list">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setArticle(null);
    setRelated([]);

    publicApi
      .article(slug)
      .then(({ data }) => {
        setArticle(data);
        document.title = `${data.title} — Oktavianus Samuel`;
        // Load related articles from same category
        return publicApi.articles({ category: data.category, limit: "4" }).then(({ data: all }) => {
          setRelated(all.filter((a) => a.slug !== slug).slice(0, 3));
        });
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section className="article-detail-section">
        <div className="container">
          <div className="articles-loading" data-reveal>
            <div className="articles-loading-dots">
              <span /><span /><span />
            </div>
            <p>Loading article…</p>
          </div>
        </div>
      </section>
    );
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
      {/* SEO meta */}
      {article.seoTitle && <title>{article.seoTitle}</title>}

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
