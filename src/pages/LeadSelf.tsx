import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/ui/Card";
import { media } from "../data/media";
import { useEffect, useMemo, useState } from "react";
import { publicApi, type PublicSitePage } from "../lib/publicApi";
import { bodyParagraphs, resolveSections, sectionCopy } from "../lib/siteContent";

const evidenceCards = [
  {
    title: "Volunteer Typist — PLD UB",
    text: "Social Intelligence and empathy appeared when I helped make lecture information accessible for students with disabilities.",
  },
  {
    title: "Camp Daniel",
    text: "Structure and perseverance appeared when I led a committee by managing timelines, communication, and coordination across divisions.",
  },
  {
    title: "Titipin",
    text: "Usefulness and system thinking appeared when I tried to centralize scattered jastip and preloved activities into a clearer platform.",
  },
  {
    title: "n8n Automation",
    text: "Automation and problem-solving appeared when I built workflows to reduce repetitive checking of academic and personal information.",
  },
];

export function LeadSelf() {
  const [leadSelfPage, setLeadSelfPage] = useState<PublicSitePage | null>(null);
  const leadSelfSections = useMemo(() => resolveSections("lead-self", leadSelfPage), [leadSelfPage]);

  useEffect(() => {
    let active = true;
    publicApi.page("lead-self").then((response) => {
      if (active) setLeadSelfPage(response.data);
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker={sectionCopy(leadSelfSections, "intro").subtitle ?? ""}
          title={sectionCopy(leadSelfSections, "intro").title ?? ""}
          description={sectionCopy(leadSelfSections, "intro").body ?? ""}
        />

        <div className="leadself-grid">
          <Card className="identity-card">
            <div className="section-kicker">{sectionCopy(leadSelfSections, "identity").subtitle}</div>
            <h2>{sectionCopy(leadSelfSections, "identity").title}</h2>
            {bodyParagraphs(sectionCopy(leadSelfSections, "identity").body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Card>
          <Card className="image-card">
            <img src={media.profile} alt="Oktavianus Samuel Minarto" />
          </Card>
        </div>

        <div className="grid grid-2">
          <Card>
            <h3>{sectionCopy(leadSelfSections, "color-code").title}</h3>
            {bodyParagraphs(sectionCopy(leadSelfSections, "color-code").body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Card>
          <Card>
            <h3>{sectionCopy(leadSelfSections, "strengths").title}</h3>
            {bodyParagraphs(sectionCopy(leadSelfSections, "strengths").body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Card>
        </div>

        <div className="containerless-split" id="self-symbol">
          <div>
            <div className="section-kicker">{sectionCopy(leadSelfSections, "self-symbol").subtitle}</div>
            <h2>{sectionCopy(leadSelfSections, "self-symbol").title}</h2>
            {bodyParagraphs(sectionCopy(leadSelfSections, "self-symbol").body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="self-symbol-visual" aria-label="Core Server self-symbol illustration">
            <img src={media.coreServer} alt="Core Server self-symbol" />
          </div>
        </div>

        <Card className="reflection-card">
          <div className="section-kicker">{sectionCopy(leadSelfSections, "empathy").subtitle}</div>
          <h2>{sectionCopy(leadSelfSections, "empathy").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "empathy").body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <img src={media.pldVolunteer} alt="PLD UB volunteer documentation" />
        </Card>

        <Card className="mission-card">
          <div className="section-kicker">{sectionCopy(leadSelfSections, "mission").subtitle}</div>
          <h2>{sectionCopy(leadSelfSections, "mission").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "mission").body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Card>

        <SectionHeader
          kicker={sectionCopy(leadSelfSections, "evidence").subtitle ?? ""}
          title={sectionCopy(leadSelfSections, "evidence").title ?? ""}
          description={sectionCopy(leadSelfSections, "evidence").body ?? ""}
        />
        <div className="grid grid-4">
          {evidenceCards.map((card) => (
            <Card key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </Card>
          ))}
        </div>

        <Card className="closing-reflection-card">
          <h2>{sectionCopy(leadSelfSections, "closing").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "closing").body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Card>
      </div>
    </section>
  );
}
