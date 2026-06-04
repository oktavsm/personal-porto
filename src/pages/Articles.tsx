import { BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "../components/ArticleCard";
import { publicApi, type PublicArticle } from "../lib/publicApi";

const CATEGORIES = [
  "All",
  "Reflection",
  "Workshop",
  "Project Log",
  "Learning Note",
  "TELADAN Journey",
  "Event Story",
  "Technical Note",
  "Personal Essay",
];

export function Articles() {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Notes & Reflections — Oktavianus Samuel";
    publicApi
      .articles()
      .then(({ data }) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load articles. Please try again.");
        setLoading(false);
      });
  }, []);

  const featured = useMemo(() => articles.find((a) => a.isFeatured), [articles]);

  const filtered = useMemo(() => {
    let result = articles;
    if (activeCategory !== "All") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [articles, activeCategory, searchQuery]);

  return (
    <section className="articles-section">
      <div className="container">
        {/* Header */}
        <div className="section-head-center" data-reveal>
          <div className="section-kicker">Writing</div>
          <h1 className="articles-heading">Notes &amp; Reflections</h1>
          <p className="section-desc wide" style={{ margin: "0 auto" }}>
            A living archive of things I learn, build, experience, and reflect on — from workshops
            and projects to personal growth and technical notes.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="articles-controls" data-reveal>
          {/* Search */}
          <div className="articles-search-wrap">
            <Search size={16} className="articles-search-icon" />
            <input
              ref={searchRef}
              id="articles-search"
              className="articles-search"
              type="search"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search articles"
            />
            {searchQuery && (
              <button
                className="icon-btn articles-search-clear"
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="articles-filters" role="group" aria-label="Filter by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`article-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                className={`article-filter-pill${activeCategory === cat ? " is-active" : ""}`}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="articles-grid" data-reveal>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="article-card" style={{ display: "flex", flexDirection: "column", padding: 24, gap: 16 }}>
                <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 24, width: "80%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, width: "100%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, width: "60%", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="articles-empty" data-reveal>
            <BookOpen size={36} />
            <p>{error}</p>
          </div>
        )}

        {/* Featured Article */}
        {!loading && !error && featured && activeCategory === "All" && !searchQuery && (
          <div className="articles-featured" data-reveal>
            <div className="section-kicker">Featured</div>
            <ArticleCard article={featured} featured />
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {filtered.length > 0 ? (
              <div className="articles-grid" data-reveal>
                {filtered
                  .filter((a) => !(activeCategory === "All" && !searchQuery && featured && a.id === featured.id))
                  .map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
              </div>
            ) : (
              <div className="articles-empty" data-reveal>
                <BookOpen size={36} />
                {searchQuery ? (
                  <p>No articles matched &ldquo;{searchQuery}&rdquo;. Try a different keyword.</p>
                ) : activeCategory !== "All" ? (
                  <p>No published articles in the {activeCategory} category yet.</p>
                ) : (
                  <p>No articles published yet. Check back soon.</p>
                )}
              </div>
            )}

            {/* Count */}
            {articles.length > 0 && (
              <p className="articles-count" data-reveal>
                {filtered.length} article{filtered.length !== 1 ? "s" : ""}
                {searchQuery || activeCategory !== "All" ? " matched" : " published"}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
