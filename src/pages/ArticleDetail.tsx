import { ArrowLeft, BookOpen, Calendar, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi, type PublicArticle, type PublicArticleBlock } from "../lib/publicApi";

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
      if (level === 2) return <h2 className="article-block-heading">{text}</h2>;
      return <h3 className="article-block-subheading">{text}</h3>;
    }

    case "image": {
      const src = String(c["src"] ?? "");
      const alt = String(c["alt"] ?? "");
      const caption = c["caption"] ? String(c["caption"]) : null;
      const layout = String(c["layout"] ?? "inline");
      return (
        <figure className={`article-block-image article-block-image-${layout}`}>
          <img src={src} alt={alt} />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }

    case "quote": {
      const text = String(c["text"] ?? "");
      const source = c["source"] ? String(c["source"]) : null;
      return (
        <blockquote className="article-block-quote">
          <p>&#8220;{text}&#8221;</p>
          {source && <cite>— {source}</cite>}
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
        <aside className={`article-block-callout article-block-callout-${variant}`}>
          <span className="callout-label">{labelMap[variant] ?? "Note"}</span>
          {title && <strong className="callout-title">{title}</strong>}
          <p>{text}</p>
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
        <div className="article-block-code-wrap">
          {lang && <span className="code-lang-label">{lang}</span>}
          <pre className="article-block-code">
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
      <section className="articles-section">
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
      <section className="articles-section">
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
    <article className="article-detail-page">
      {/* SEO meta */}
      {article.seoTitle && <title>{article.seoTitle}</title>}

      {/* Back nav */}
      <div className="container">
        <div className="article-detail-back" data-reveal>
          <Link to="/articles" className="btn">
            <ArrowLeft size={16} /> Notes &amp; Reflections
          </Link>
        </div>
      </div>

      {/* Hero */}
      <header className="article-detail-hero">
        <div className="container">
          <div className="article-detail-meta-top" data-reveal>
            <span className="article-badge article-badge-category">{article.category}</span>
            <span className="article-detail-date">
              <Calendar size={14} />
              {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
            </span>
            <span className="article-detail-reading">
              <BookOpen size={14} />
              {article.readingTime} min read
            </span>
          </div>

          <h1 className="article-detail-title" data-reveal>
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="article-detail-subtitle" data-reveal>
              {article.subtitle}
            </p>
          )}

          <p className="article-detail-author" data-reveal>
            By <strong>{article.author.name}</strong>
            {article.author.role && <span> · {article.author.role}</span>}
          </p>
        </div>
      </header>

      {/* Cover image */}
      {article.coverImage && (
        <div className="article-detail-cover" data-reveal>
          <div className="container">
            <img src={article.coverImage} alt={article.coverAlt || article.title} />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="article-detail-body container" data-reveal>
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
        <footer className="article-detail-tags container" data-reveal>
          <Tag size={15} />
          {article.tags.map((tag) => (
            <span key={tag} className="article-tag">
              {tag}
            </span>
          ))}
        </footer>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="article-related">
          <div className="container">
            <div className="section-kicker" data-reveal>
              More from {article.category}
            </div>
            <div className="articles-grid articles-grid-sm" data-reveal>
              {related.map((a) => (
                <Link
                  key={a.id}
                  to={`/articles/${a.slug}`}
                  className="article-related-card card"
                  aria-label={`Read: ${a.title}`}
                >
                  {a.coverImage && (
                    <img
                      src={a.coverImage}
                      alt={a.coverAlt || a.title}
                      className="article-related-cover"
                    />
                  )}
                  <span className="article-badge article-badge-category">{a.category}</span>
                  <strong>{a.title}</strong>
                  <span className="article-card-meta-item">
                    <BookOpen size={12} /> {a.readingTime} min
                  </span>
                </Link>
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
