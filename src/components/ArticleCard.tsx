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
      className={`article-card card${featured ? " article-card-featured" : ""}`}
      aria-label={`Read: ${article.title}`}
    >
      {/* Cover image */}
      {article.coverImage ? (
        <div className="article-card-cover">
          <img src={article.coverImage} alt={article.coverAlt || article.title} />
        </div>
      ) : (
        <div className="article-card-cover article-card-cover-placeholder">
          <BookOpen size={28} />
        </div>
      )}

      {/* Body */}
      <div className="article-card-body">
        {/* Meta top */}
        <div className="article-card-meta-top">
          <span className="article-badge article-badge-category">{article.category}</span>
          {article.isFeatured && (
            <span className="article-badge article-badge-featured">
              <Star size={11} /> Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="article-card-title">{article.title}</h3>
        {article.subtitle && <p className="article-card-subtitle">{article.subtitle}</p>}

        {/* Excerpt */}
        <p className="article-card-excerpt">{article.excerpt}</p>

        {/* Meta bottom */}
        <div className="article-card-meta-bottom">
          <span className="article-card-meta-item">
            <Calendar size={13} />
            {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
          </span>
          <span className="article-card-meta-item">
            <BookOpen size={13} />
            {article.readingTime} min read
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="article-tags">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="article-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
