import { ExternalLink } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const liveProjects = [
  {
    title: "Titipin",
    url: "https://titipin.me",
    description: "A deployed jastip and preloved platform. Embedded when iframe settings allow it.",
  },
  {
    title: "Oktaavsm Dev Playground",
    url: "https://oktaavsm.bccdev.id",
    description: "A living playground for APIs, AI daily content, Spotify status, and experiments.",
  },
];

export function Live() {
  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Live Systems"
          title="Projects you can open, inspect, or use"
          description="This page collects deployed projects, experiments, and living systems that represent how I build and learn in public."
        />
        <p className="technical-note">
          Some projects are embedded directly. If a site does not behave well inside a frame, the external link is
          provided as the reliable route.
        </p>
        <div className="live-grid">
          {liveProjects.map((project) => (
            <Card className="live-card" key={project.title}>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <Button href={project.url} variant="primary">
                  Open Site <ExternalLink size={16} />
                </Button>
              </div>
              <div className="live-frame">
                <iframe src={project.url} title={`${project.title} live preview`} loading="lazy" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
