import { ArrowUpRight, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { Project } from "../data/projects";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="project-card">
      <div className="card-media">
        <img src={project.images[0]} alt={`${project.title} preview`} loading="lazy" />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <Badge tone={project.priority === "Flagship" ? "bright" : "default"}>{project.priority}</Badge>
          <Badge>{project.category}</Badge>
          <Badge>{project.status}</Badge>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <div className="pill-row">
          {project.techStack.slice(0, 4).map((tech) => (
            <span className="pill" key={tech}>
              {tech}
            </span>
          ))}
        </div>
        <div className="card-actions">
          <Link to={`/projects/${project.slug}`}>
            Case Study <ArrowUpRight size={15} />
          </Link>
          {project.links.github ? (
            <a href={project.links.github} target="_blank" rel="noreferrer">
              Code <Github size={15} />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
