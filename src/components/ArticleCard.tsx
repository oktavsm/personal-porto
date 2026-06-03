import { BookOpen, Calendar, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicArticle } from "../lib/publicApi";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleCard({ article, featured = false }: { article: PublicArticle; featured?: boolean }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className={`article-card${featured ? " is-featured" : ""}`}
      aria-label={`Read: ${article.title}`}
    >
      {/* Cover image */}
      {article.coverImage ? (
        <img src={article.coverImage} alt={article.coverAlt || article.title} className="article-card-cover" />
      ) : (
        <div className="article-card-cover" style={{ display: "grid", placeItems: "center" }}>
          <BookOpen size={28} style={{ color: "var(--muted-2)" }} />
        </div>
      )}

      {/* Body */}
      <div className="article-card-content">
        {/* Meta top */}
        <div className="article-card-meta">
          <span>{article.category}</span>
          <span className="article-card-meta-dot" />
          {article.isFeatured && (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={11} /> Featured
              </span>
              <span className="article-card-meta-dot" />
            </>
          )}
          <span>{article.publishedAt ? formatDate(article.publishedAt) : "Draft"}</span>
        </div>

        {/* Title */}
        <h3 className="article-card-title">{article.title}</h3>
        {article.subtitle && <p className="article-card-excerpt" style={{ fontStyle: "italic", marginBottom: 8, marginTop: 0 }}>{article.subtitle}</p>}

        {/* Excerpt */}
        <p className="article-card-excerpt">{article.excerpt}</p>

        {/* Meta bottom */}
        <div className="article-card-meta" style={{ marginBottom: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={13} />
            {article.readingTime} min read
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="article-card-tags">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="article-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
