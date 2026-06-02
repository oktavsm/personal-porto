import { ProjectCard } from "../components/ProjectCard";
import { SectionHeader } from "../components/SectionHeader";
import { projects, type Project } from "../data/projects";
import { useEffect, useMemo, useState } from "react";
import { publicApi, type PublicProject } from "../lib/publicApi";

const categories = ["All", "Android", "Web", "Automation", "AI", "Utility"] as const;

export function Projects() {
  const [apiProjects, setApiProjects] = useState<PublicProject[] | null>(null);
  const staticBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), []);

  useEffect(() => {
    let active = true;

    publicApi.projects().then((response) => {
      if (active && response.data.length > 0) {
        setApiProjects(response.data);
      }
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const visibleProjects: Project[] = useMemo(
    () =>
      apiProjects?.map((project) => {
        const staticProject = staticBySlug.get(project.slug);
        return {
          slug: project.slug,
          title: project.title,
          ecosystem: project.ecosystem ?? undefined,
          category: project.category as Project["category"],
          priority: project.priority as Project["priority"],
          summary: project.summary,
          problem: project.problem,
          solution: project.solution,
          role: project.roles,
          status: project.status as Project["status"],
          techStack: project.techStack,
          links: {
            demo: project.links.demo,
            github: project.links.github,
            download: project.links.download,
          },
          images: project.images.length > 0 ? project.images : staticProject?.images ?? [],
          learnings: project.learnings,
        };
      }) ?? projects,
    [apiProjects, staticBySlug],
  );

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
          {visibleProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
