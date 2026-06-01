import { ArrowUpRight } from "lucide-react";
import { Experience } from "../data/experiences";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

type ExperienceCardProps = {
  experience: Experience;
};

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card className="experience-card">
      {experience.image ? (
        <div className="experience-image">
          <img src={experience.image} alt={`${experience.title} at ${experience.organization}`} loading="lazy" />
        </div>
      ) : null}
      <div className="card-meta">
        <Badge>{experience.category}</Badge>
        <Badge>{experience.period}</Badge>
      </div>
      <h3>{experience.title}</h3>
      <p className="organization">{experience.organization}</p>
      <p>{experience.summary}</p>
      <div className="quote-line">{experience.reflection}</div>
      <a className="inline-link" href={`/experiences#${experience.slug}`}>
        Read context <ArrowUpRight size={15} />
      </a>
    </Card>
  );
}
