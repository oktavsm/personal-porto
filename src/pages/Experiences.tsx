import { ExperienceCard } from "../components/ExperienceCard";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/ui/Card";
import { experiences } from "../data/experiences";

export function Experiences() {
  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Experiences"
          title="Experiences that shaped how I build and serve"
          description="I treat experiences as evidence of how values show up in real situations: service, leadership, teaching, technical growth, and community contribution."
        />
        <div className="grid grid-3">
          {experiences.slice(0, 6).map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </div>
        <div className="experience-list">
          {experiences.map((experience) => (
            <Card key={experience.slug} className="experience-detail" id={experience.slug}>
              <div>
                <div className="section-kicker">{experience.category} · {experience.period}</div>
                <h3>{experience.title}</h3>
                <p className="organization">{experience.organization}</p>
                <p>{experience.summary}</p>
              </div>
              <div>
                <h4>What I did</h4>
                <ul>
                  {experience.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Impact</h4>
                <ul>
                  {experience.impact.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
