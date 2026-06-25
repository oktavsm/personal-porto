import { SectionHeader } from "../components/SectionHeader";
import { FormattedText } from "../components/FormattedText";
import { Card } from "../components/ui/Card";
import { media } from "../data/media";
import { useEffect, useMemo, useState } from "react";
import { publicApi, type PublicSitePage } from "../lib/publicApi";
import { bodyParagraphs, cardBlocks, resolveSections, sectionAnchor, sectionCopy, sectionSettings, settingImage, settingTextAlign } from "../lib/siteContent";

const leadSelfImageByKey: Record<string, string> = {
  profile: media.profile,
  coreServer: media.coreServer,
  pldVolunteer: media.pldVolunteer,
};

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

const interestStrengthCards = [
  {
    title: "Analytical core",
    text: "Logical-mathematical strength, problem solving, analytical thinking, competitive programming, and debugging show the way I break problems down.",
  },
  {
    title: "Practical builder",
    text: "Kinesthetic and realistic tendencies show up when I learn by building, testing, implementing, and turning ideas into working tools.",
  },
  {
    title: "People-aware communicator",
    text: "Interpersonal skill appears in teaching, mentoring, volunteering, and explaining technical concepts so they become easier to understand.",
  },
];

export function LeadSelf() {
  const [leadSelfPage, setLeadSelfPage] = useState<PublicSitePage | null>(null);
  const leadSelfSections = useMemo(() => resolveSections("lead-self", leadSelfPage), [leadSelfPage]);
  const leadSelfEvidenceCards = useMemo(() => cardBlocks(leadSelfSections, "evidence", evidenceCards), [leadSelfSections]);
  const leadSelfInterestCards = useMemo(() => cardBlocks(leadSelfSections, "interest-strength-pattern", interestStrengthCards), [leadSelfSections]);
  const introImage = settingImage(sectionSettings(leadSelfSections, "intro"), leadSelfImageByKey, media.profile);
  const selfSymbolImage = settingImage(sectionSettings(leadSelfSections, "self-symbol"), leadSelfImageByKey, media.coreServer);
  const empathyImage = settingImage(sectionSettings(leadSelfSections, "empathy"), leadSelfImageByKey, media.pldVolunteer);
  const sectionTitleStyle = (key: string) => ({ textAlign: settingTextAlign(sectionSettings(leadSelfSections, key), "titleAlign") });
  const sectionBodyStyle = (key: string) => ({ textAlign: settingTextAlign(sectionSettings(leadSelfSections, key), "bodyAlign") });
  const sectionHeaderAlign = (key: string) => ({
    titleAlign: settingTextAlign(sectionSettings(leadSelfSections, key), "titleAlign"),
    descriptionAlign: settingTextAlign(sectionSettings(leadSelfSections, key), "bodyAlign"),
  });
  const anchor = (key: string) => sectionAnchor(leadSelfSections, key);

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
          {...sectionHeaderAlign("intro")}
        />

        <Card className="leadself-context-card">
          <p>
            <FormattedText text="Lead Self is a self-discovery and leadership development phase in the TELADAN program by Tanoto Foundation. It helped me understand myself more deeply before trying to lead others." />
          </p>
          <p>
            <FormattedText text="The reflections on this page are the foundation behind the way I present my story, core values, mission, and self-symbol across this portfolio." />
          </p>
        </Card>

        <div className="leadself-grid">
          <Card className="identity-card">
            <div className="section-kicker">{sectionCopy(leadSelfSections, "identity").subtitle}</div>
            <h2 style={sectionTitleStyle("identity")}>{sectionCopy(leadSelfSections, "identity").title}</h2>
            {bodyParagraphs(sectionCopy(leadSelfSections, "identity").body).map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={sectionBodyStyle("identity")}><FormattedText text={paragraph} /></p>
            ))}
          </Card>
          <Card className="image-card">
            <img src={introImage} alt="Oktavianus Samuel Minarto" />
          </Card>
        </div>

        <div className="grid grid-2">
          <Card>
            <h3 style={sectionTitleStyle("color-code")}>{sectionCopy(leadSelfSections, "color-code").title}</h3>
            {bodyParagraphs(sectionCopy(leadSelfSections, "color-code").body).map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={sectionBodyStyle("color-code")}><FormattedText text={paragraph} /></p>
            ))}
          </Card>
          <Card>
            <h3 style={sectionTitleStyle("strengths")}>{sectionCopy(leadSelfSections, "strengths").title}</h3>
            {bodyParagraphs(sectionCopy(leadSelfSections, "strengths").body).map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={sectionBodyStyle("strengths")}><FormattedText text={paragraph} /></p>
            ))}
          </Card>
        </div>

        <Card className="leadself-pattern-card" id={anchor("interest-strength-pattern")}>
          <div className="section-kicker">{sectionCopy(leadSelfSections, "interest-strength-pattern").subtitle}</div>
          <h2 style={sectionTitleStyle("interest-strength-pattern")}>{sectionCopy(leadSelfSections, "interest-strength-pattern").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "interest-strength-pattern").body).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} style={sectionBodyStyle("interest-strength-pattern")}><FormattedText text={paragraph} /></p>
          ))}
          <div className="leadself-pattern-grid" aria-label="Interest and strength pattern cards">
            {leadSelfInterestCards.map((card) => (
              <div className="leadself-pattern-item" key={card.title}>
                <strong>{card.title}</strong>
                <span><FormattedText text={card.text} /></span>
              </div>
            ))}
          </div>
        </Card>

        <div className="containerless-split" id="self-symbol">
          <div>
            <div className="section-kicker">{sectionCopy(leadSelfSections, "self-symbol").subtitle}</div>
            <h2 style={sectionTitleStyle("self-symbol")}>{sectionCopy(leadSelfSections, "self-symbol").title}</h2>
            {bodyParagraphs(sectionCopy(leadSelfSections, "self-symbol").body).map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={sectionBodyStyle("self-symbol")}><FormattedText text={paragraph} /></p>
            ))}
          </div>
          <div className="self-symbol-visual" aria-label="Core Server self-symbol illustration">
            <img src={selfSymbolImage} alt="Core Server self-symbol" />
          </div>
        </div>

        <Card className="reflection-card">
          <div className="section-kicker">{sectionCopy(leadSelfSections, "empathy").subtitle}</div>
          <h2 style={sectionTitleStyle("empathy")}>{sectionCopy(leadSelfSections, "empathy").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "empathy").body).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} style={sectionBodyStyle("empathy")}><FormattedText text={paragraph} /></p>
          ))}
          <img src={empathyImage} alt="PLD UB volunteer documentation" />
        </Card>

        <Card className="mission-card">
          <div className="section-kicker">{sectionCopy(leadSelfSections, "mission").subtitle}</div>
          <h2 style={sectionTitleStyle("mission")}>{sectionCopy(leadSelfSections, "mission").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "mission").body).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} style={sectionBodyStyle("mission")}><FormattedText text={paragraph} /></p>
          ))}
        </Card>

        <SectionHeader
          kicker={sectionCopy(leadSelfSections, "evidence").subtitle ?? ""}
          title={sectionCopy(leadSelfSections, "evidence").title ?? ""}
          description={sectionCopy(leadSelfSections, "evidence").body ?? ""}
          {...sectionHeaderAlign("evidence")}
        />
        <div className="grid grid-4">
          {leadSelfEvidenceCards.map((card) => (
            <Card key={card.title}>
              <h3>{card.title}</h3>
              <p><FormattedText text={card.text} /></p>
            </Card>
          ))}
        </div>

        <Card className="closing-reflection-card">
          <h2 style={sectionTitleStyle("closing")}>{sectionCopy(leadSelfSections, "closing").title}</h2>
          {bodyParagraphs(sectionCopy(leadSelfSections, "closing").body).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} style={sectionBodyStyle("closing")}><FormattedText text={paragraph} /></p>
          ))}
        </Card>
      </div>
    </section>
  );
}
