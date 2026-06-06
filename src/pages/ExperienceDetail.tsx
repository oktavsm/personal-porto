import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormattedText } from "../components/FormattedText";
import { Card } from "../components/ui/Card";
import { experiences, type Experience } from "../data/experiences";
import { publicApi, type PublicExperience } from "../lib/publicApi";

type DetailExperience = Experience & {
  images: string[];
};

function mapPublicExperience(experience: PublicExperience, staticExperience?: Experience): DetailExperience {
  const fallbackImage = staticExperience?.image;
  const images = experience.images.length > 0 ? experience.images : fallbackImage ? [fallbackImage] : [];

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
    image: images[0],
    images,
  };
}

function mapStaticExperience(experience?: Experience): DetailExperience | undefined {
  if (!experience) return undefined;
  return {
    ...experience,
    images: experience.image ? [experience.image] : [],
  };
}

export function ExperienceDetail() {
  const { slug } = useParams();
  const staticExperience = experiences.find((item) => item.slug === slug);
  const [apiExperience, setApiExperience] = useState<PublicExperience | null>(null);
  const [apiMissing, setApiMissing] = useState(false);
  const experience = useMemo(
    () => (apiExperience ? mapPublicExperience(apiExperience, staticExperience) : mapStaticExperience(staticExperience)),
    [apiExperience, staticExperience],
  );

  useEffect(() => {
    if (!slug) return;
    let active = true;

    publicApi.experience(slug).then((response) => {
      if (active) setApiExperience(response.data);
    }).catch(() => {
      if (active) setApiMissing(true);
    });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!experience && !apiMissing) {
    return (
      <section className="page-section">
        <div className="container">
          <Card>Loading experience...</Card>
        </div>
      </section>
    );
  }

  if (!experience) {
    return (
      <section className="page-section">
        <div className="container">
          <h1>Experience not found.</h1>
          <Button to="/experiences">Back to Experiences</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container detail-layout">
        <Link className="back-link" to="/experiences">
          <ArrowLeft size={16} /> Back to Experiences
        </Link>

        <div className="detail-hero">
          <div>
            <div className="section-kicker">{experience.category} · {experience.period}</div>
            <h1>{experience.title}</h1>
            <p className="organization"><FormattedText text={experience.organization} /></p>
            <p><FormattedText text={experience.summary} /></p>
          </div>
          <Card className="image-card">
            {experience.image ? <img src={experience.image} alt={`${experience.title} documentation`} /> : <div className="project-detail-placeholder">{experience.category}</div>}
          </Card>
        </div>

        <Card className="experience-reflection-card">
          <div className="section-kicker">Reflection</div>
          <p className="experience-reflection-copy"><FormattedText text={experience.reflection} /></p>
        </Card>

        <div className="detail-grid">
          <Card>
            <h3>What I did</h3>
            <ul>
              {experience.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3>Impact</h3>
            <ul>
              {experience.impact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3>Values Practiced</h3>
            <div className="pill-row">
              {experience.values.map((value) => (
                <span className="pill" key={value}>{value}</span>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <h2>Experience Gallery</h2>
          <div className="gallery-grid">
            {experience.images.map((image) => (
              <img src={image} alt={`${experience.title} gallery`} key={image} loading="lazy" />
            ))}
            {experience.images.length === 0 ? <div className="project-detail-placeholder">No gallery yet.</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
