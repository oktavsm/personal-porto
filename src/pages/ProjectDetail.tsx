import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { projects } from "../data/projects";

export function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);

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
            <img src={project.images[0]} alt={`${project.title} preview`} />
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
            {project.images.map((image) => (
              <img src={image} alt={`${project.title} screenshot`} key={image} loading="lazy" />
            ))}
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
