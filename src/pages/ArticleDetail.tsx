import { ArrowLeft, ArrowRight, BookOpen, Calendar, Link as LinkIcon, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicApi, type PublicArticle } from "../lib/publicApi";
import { ArticleCard } from "../components/ArticleCard";
import { ArticleContent, getArticleTableOfContents } from "../components/articles/ArticleContent";

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

  const tableOfContents = getArticleTableOfContents(article?.blocks ?? []);

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

      <ArticleContent blocks={article.blocks} />

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
