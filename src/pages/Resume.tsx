import { Download, ExternalLink } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { certifications } from "../data/certifications";
import { media } from "../data/media";

export function Resume() {
  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Resume"
          title="A compact view of my professional profile"
          description="This page is the compact version of my journey — for recruiters, mentors, and collaborators who need the practical view."
        />
        <div className="resume-layout">
          <Card>
            <h3>Quick Profile</h3>
            <p>
              Informatics Engineering student at Universitas Brawijaya, interested in software engineering, Android
              development, AI, automation, and network systems.
            </p>
            <div className="actions">
              <Button href={media.cv} variant="primary">
                <Download size={16} /> Download CV
              </Button>
              <Button href="https://www.linkedin.com/in/oktaavsm/">
                LinkedIn <ExternalLink size={16} />
              </Button>
            </div>
          </Card>
          <Card className="resume-frame">
            <iframe src={media.cv} title="Oktavianus Samuel Minarto CV" />
          </Card>
        </div>

        <SectionHeader
          kicker="Certifications"
          title="Credentials that support my learning path"
          description="A focused list of technical certifications in Android, networking, backend, AI, and programming."
        />
        <div className="grid grid-2">
          {certifications.map((certification) => (
            <Card key={certification.title}>
              <div className="card-meta">
                <span className="badge">{certification.issuer}</span>
                {certification.featured ? <span className="badge badge-bright">Featured</span> : null}
              </div>
              <h3>{certification.title}</h3>
              <p>
                Issued {certification.issuedAt}
                {certification.expiresAt ? ` · Valid until ${certification.expiresAt}` : ""}
              </p>
              <div className="pill-row">
                {certification.skills.map((skill) => (
                  <span className="pill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              {certification.credentialUrl ? (
                <a className="inline-link" href={certification.credentialUrl} target="_blank" rel="noreferrer">
                  View Credential <ExternalLink size={15} />
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
