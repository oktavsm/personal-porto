import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { publicApi, type PublicLiveSystem } from "../lib/publicApi";

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

type LiveProjectView = {
  title: string;
  url: string;
  description: string;
  embedUrl?: string | null;
  isEmbeddable: boolean;
};

export function Live() {
  const [apiProjects, setApiProjects] = useState<PublicLiveSystem[] | null>(null);
  const projects: LiveProjectView[] =
    apiProjects && apiProjects.length > 0
      ? apiProjects
      : liveProjects.map((project) => ({
          ...project,
          embedUrl: project.url,
          isEmbeddable: true,
        }));

  useEffect(() => {
    let active = true;

    publicApi.systems().then((response) => {
      if (active && response.data.length > 0) {
        setApiProjects(response.data);
      }
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

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
          {projects.map((project) => (
            <Card className="live-card" key={project.title}>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <Button href={project.url} variant="primary">
                  Open Site <ExternalLink size={16} />
                </Button>
              </div>
              {!project.isEmbeddable ? (
                <div className="live-frame live-frame-placeholder">
                  <p>Preview disabled for this system.</p>
                </div>
              ) : (
                <div className="live-frame">
                  <iframe src={project.embedUrl ?? project.url} title={`${project.title} live preview`} loading="lazy" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
