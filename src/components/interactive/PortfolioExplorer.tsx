import { ArrowRight, Compass, Route, X } from "lucide-react";
import { Link } from "react-router-dom";
import { perspectives, projectInterests } from "../../data/perspectives";
import { projects } from "../../data/projects";
import { useEffect, useState } from "react";

type PortfolioExplorerProps = {
  compact?: boolean;
};

type PortfolioExplorerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function PortfolioExplorerContent({ compact = false }: PortfolioExplorerProps) {
  const [activePerspectiveId, setActivePerspectiveId] = useState(perspectives[0].id);
  const [activeInterestId, setActiveInterestId] = useState(projectInterests[0].id);

  const activePerspective = perspectives.find((item) => item.id === activePerspectiveId) ?? perspectives[0];
  const activeInterest = projectInterests.find((item) => item.id === activeInterestId) ?? projectInterests[0];
  const matchedProjects = activeInterest.projectSlugs
    .map((slug) => projects.find((project) => project.slug === slug))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <>
      <div className="explorer-layout">
        <div className="perspective-list" role="tablist" aria-label="Visitor perspective">
          {perspectives.map((perspective) => (
            <button
              className={`perspective-button ${activePerspective.id === perspective.id ? "perspective-button-active" : ""}`}
              type="button"
              key={perspective.id}
              onClick={() => setActivePerspectiveId(perspective.id)}
            >
              <span>{perspective.label}</span>
              <small>{perspective.shortDescription}</small>
            </button>
          ))}
        </div>

        <div className="recommendation-panel">
          <div className="panel-icon">
            <Compass size={22} />
          </div>
          <div className="section-kicker">Recommended route</div>
          <h3>{activePerspective.label}</h3>
          <p>{activePerspective.recommendation}</p>
          <div className="highlight-pills">
            {activePerspective.highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          <div className="route-links">
            {activePerspective.links.map((link) => (
              <Link to={link.href} key={link.href}>
                {link.label} <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="matchmaker-panel">
          <div className="matchmaker-copy">
            <div className="section-kicker">Project matchmaker</div>
            <h3>Find projects by interest.</h3>
            <p>
              This matchmaker helps you explore my projects based on the kind of problem, technology, or interest you
              care about. Instead of reading every project one by one, you can start from what matters to you.
            </p>
            <p>Pick an interest, and I will show the projects that fit it best.</p>
          </div>

          <div className="interest-tabs" role="tablist" aria-label="Project interests">
            {projectInterests.map((interest) => (
              <button
                className={activeInterest.id === interest.id ? "interest-tab-active" : ""}
                type="button"
                key={interest.id}
                onClick={() => setActiveInterestId(interest.id)}
              >
                {interest.label}
              </button>
            ))}
          </div>

          <div className="matched-projects">
            <div className="matched-intro">
              <Route size={18} />
              <span>{activeInterest.description}</span>
            </div>
            {matchedProjects.map((project) =>
              project ? (
                <Link to={`/projects/${project.slug}`} className="matched-project-card" key={project.slug}>
                  <strong>{project.title}</strong>
                  <span>{project.summary}</span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function PortfolioExplorer() {
  return (
    <section className="interactive-section" id="explorer">
      <div className="container">
        <div className="interactive-head">
          <div>
            <div className="section-kicker">Portfolio explorer</div>
            <h2>Now choose where to go deeper.</h2>
          </div>
          <p>
            Not every visitor comes for the same reason. This explorer helps you find the parts of my portfolio that
            are most relevant to your purpose — whether you are a recruiter, mentor, collaborator, fellow student, or
            just curious.
            <br />
            <br />
            Choose your perspective, and I will route you to the most relevant parts of this portfolio.
          </p>
        </div>

        <PortfolioExplorerContent />
      </div>
    </section>
  );
}

export function PortfolioExplorerModal({ isOpen, onClose }: PortfolioExplorerModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="route-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="route-modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="route-modal-close" type="button" aria-label="Close route explorer" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="route-modal-head">
          <div>
            <div className="section-kicker">Quick route</div>
            <h2 id="route-modal-title">Choose your path, or keep reading the story.</h2>
          </div>
          <p>
            If you already know what you need, jump directly. If not, continue the story first and this route will appear
            again near the end.
          </p>
        </div>
        <PortfolioExplorerContent compact />
        <div className="route-modal-actions">
          <Link className="inline-link" to="/#story" onClick={onClose}>
            Continue the story <ArrowRight size={15} />
          </Link>
          <Link className="inline-link muted-link" to="/#explorer" onClick={onClose}>
            See full explorer later
          </Link>
        </div>
      </div>
    </div>
  );
}
