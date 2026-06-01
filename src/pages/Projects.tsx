import { ProjectCard } from "../components/ProjectCard";
import { SectionHeader } from "../components/SectionHeader";
import { projects } from "../data/projects";

const categories = ["All", "Android", "Web", "Automation", "AI", "Utility"] as const;

export function Projects() {
  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Projects"
          title="Things I built when I noticed friction"
          description="Each project started from a small friction: scattered information, repetitive work, unclear flow, or a need that could be made easier through software."
        />
        <div className="filter-row">
          {categories.map((category) => (
            <span className="pill" key={category}>
              {category}
            </span>
          ))}
        </div>
        <div className="grid grid-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
