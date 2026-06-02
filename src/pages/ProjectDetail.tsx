import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { projects, type Project } from "../data/projects";
import { publicApi, type PublicProject } from "../lib/publicApi";

function mapPublicProject(project: PublicProject, staticProject?: Project): Project {
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
}

export function ProjectDetail() {
  const { slug } = useParams();
  const staticProject = projects.find((item) => item.slug === slug);
  const [apiProject, setApiProject] = useState<PublicProject | null>(null);
  const [apiMissing, setApiMissing] = useState(false);
  const project = useMemo(
    () => (apiProject ? mapPublicProject(apiProject, staticProject) : staticProject),
    [apiProject, staticProject],
  );

  useEffect(() => {
    if (!slug) return;
    let active = true;

    publicApi.project(slug).then((response) => {
      if (active) setApiProject(response.data);
    }).catch(() => {
      if (active) setApiMissing(true);
    });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!project && !apiMissing) {
    return (
      <section className="page-section">
        <div className="container">
          <Card>Loading project...</Card>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="page-section">
        <div className="container">
          <h1>Project not found.</h1>
          <Button to="/projects">Back to Projects</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container detail-layout">
        <Link className="back-link" to="/projects">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="detail-hero">
          <div>
            <div className="section-kicker">{project.category} · {project.status}</div>
            <h1>{project.title}</h1>
            <p>{project.summary}</p>
            <div className="actions">
              {project.links.demo ? (
                <Button href={project.links.demo} variant="primary">
                  Live Demo <ExternalLink size={16} />
                </Button>
              ) : null}
              {project.links.github ? (
                <Button href={project.links.github}>
                  Source Code <Github size={16} />
                </Button>
              ) : null}
            </div>
          </div>
          <Card className="image-card">
            {project.images[0] ? <img src={project.images[0]} alt={`${project.title} preview`} /> : <div className="project-detail-placeholder">{project.category}</div>}
          </Card>
        </div>

        <div className="detail-grid">
          <Card>
            <h3>Problem</h3>
            <p>{project.problem}</p>
          </Card>
          <Card>
            <h3>Solution</h3>
            <p>{project.solution}</p>
          </Card>
          <Card>
            <h3>My Role</h3>
            <ul>
              {project.role.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3>What I Learned</h3>
            <ul>
              {project.learnings.map((learning) => (
                <li key={learning}>{learning}</li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <h2>Project Gallery</h2>
          <div className="gallery-grid">
            {(project.images.length > 0 ? project.images : []).map((image) => (
              <img src={image} alt={`${project.title} screenshot`} key={image} loading="lazy" />
            ))}
            {project.images.length === 0 ? <div className="project-detail-placeholder">No gallery yet.</div> : null}
          </div>
        </div>

        <Card>
          <h3>Tech Stack</h3>
          <div className="pill-row">
            {project.techStack.map((tech) => (
              <span className="pill" key={tech}>
                {tech}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
