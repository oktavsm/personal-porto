import { ExperienceCard } from "../components/ExperienceCard";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/ui/Card";
import { experiences, type Experience } from "../data/experiences";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi, type PublicExperience } from "../lib/publicApi";

type VisibleExperience = Experience & {
  isFeatured: boolean;
  images: string[];
};

export function Experiences() {
  const [apiExperiences, setApiExperiences] = useState<PublicExperience[] | null>(null);
  const staticBySlug = useMemo(() => new Map(experiences.map((experience) => [experience.slug, experience])), []);

  useEffect(() => {
    let active = true;

    publicApi.experiences().then((response) => {
      if (active && response.data.length > 0) {
        setApiExperiences(response.data);
      }
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const visibleExperiences: VisibleExperience[] = useMemo(
    () =>
      apiExperiences?.map((experience) => {
        const staticExperience = staticBySlug.get(experience.slug);
        return {
          slug: experience.slug,
          title: experience.title,
          organization: experience.organization,
          period: experience.period,
          category: experience.category as Experience["category"],
          summary: experience.summary,
          responsibilities: experience.responsibilities,
          impact: experience.impact,
          reflection: experience.reflection,
          values: experience.values,
          image: experience.images[0] ?? staticExperience?.image,
          images: experience.images.length > 0 ? experience.images : staticExperience?.image ? [staticExperience.image] : [],
          isFeatured: experience.isFeatured,
        };
      }) ?? experiences.map((experience, index) => ({ ...experience, images: experience.image ? [experience.image] : [], isFeatured: index < 6 })),
    [apiExperiences, staticBySlug],
  );
  const featuredExperiences = useMemo(() => visibleExperiences.filter((experience) => experience.isFeatured), [visibleExperiences]);

  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Experiences"
          title="Experiences that shaped how I build and serve"
          description="I treat experiences as evidence of how values show up in real situations: service, leadership, teaching, technical growth, and community contribution."
        />
        <div className="grid grid-3">
          {featuredExperiences.map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </div>
        <div className="experience-list">
          {visibleExperiences.map((experience) => (
            <Card key={experience.slug} className="experience-detail" id={experience.slug}>
              <div>
                <div className="section-kicker">{experience.category} · {experience.period}</div>
                <h3>{experience.title}</h3>
                <p className="organization">{experience.organization}</p>
                <p>{experience.summary}</p>
                <Link className="inline-link" to={`/experiences/${experience.slug}`}>
                  Read full context <ArrowUpRight size={15} />
                </Link>
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
