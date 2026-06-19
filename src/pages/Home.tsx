import { ArrowRight, Compass, Download, Mail } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ExperienceCard } from "../components/ExperienceCard";
import { FormattedText } from "../components/FormattedText";
import { HomeMusicSection } from "../components/MusicPlayer";
import { ProjectCard } from "../components/ProjectCard";
import { SectionHeader } from "../components/SectionHeader";
import { ServerVisual } from "../components/ServerVisual";
import { CoreServerMap } from "../components/interactive/CoreServerMap";
import { PortfolioExplorer, PortfolioExplorerModal } from "../components/interactive/PortfolioExplorer";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { media } from "../data/media";
import { experiences, featuredExperiences, type Experience } from "../data/experiences";
import { featuredProjects, projects, type Project } from "../data/projects";
import { publicApi, type PublicExperience, type PublicProject, type PublicSitePage } from "../lib/publicApi";
import { bodyParagraphs, cardBlocks, resolveSections, sectionCopy, sectionSettings, settingImage, settingString, settingTextAlign } from "../lib/siteContent";

const earlyCards = [
  { title: "Silat", imageKey: "earlySilat", image: media.earlySilat, text: "Discipline, physical control, consistency, and courage to train through repetition." },
  { title: "PMR & Jumbara", imageKey: "earlyPmr", image: media.earlyPmr, text: "Care, independence, service, and perspective beyond my daily environment." },
  { title: "Pramuka / OSIS", imageKey: "earlyPramuka", image: media.earlyPramuka, text: "Responsibility, teamwork, and early experience in leading and organizing people." },
  { title: "Competitions", imageKey: "highSchoolWinner", image: media.highSchoolWinner, text: "Focus, growth, and courage to test myself through challenges." },
];

const cardImageByKey: Record<string, string> = {
  earlySilat: media.earlySilat,
  earlyPmr: media.earlyPmr,
  earlyPramuka: media.earlyPramuka,
  highSchoolWinner: media.highSchoolWinner,
  ssnStudy: media.ssnStudy,
  ssnAfterAcademic: media.ssnAfterAcademic,
  ssnHealth: media.ssnHealth,
};

const cmsImageByKey: Record<string, string> = {
  ...cardImageByKey,
  profile: media.profile,
  pldVolunteer: media.pldVolunteer,
  tanoto: media.tanoto,
  speakerTeladan: media.speakerTeladan,
  campDanielWide: media.campDanielWide,
  highSchoolCertificate: media.highSchoolCertificate,
};

const selectionCards = [
  { title: "SKD Preparation", imageKey: "ssnStudy", image: media.ssnStudy, text: "Learning discipline, consistency, and test strategy." },
  { title: "Academic Test", imageKey: "ssnAfterAcademic", image: media.ssnAfterAcademic, text: "Facing mathematics and English as the next gate." },
  { title: "Health Selection", imageKey: "ssnHealth", image: media.ssnHealth, text: "The stage where the route finally changed." },
];

const values = [
  {
    title: "Stability",
    text: "I try to stay steady before making decisions. Calmness is the space I create before choosing a response.",
  },
  {
    title: "Structure",
    text: "I naturally look for patterns, flows, and missing connections in scattered things.",
  },
  {
    title: "Usefulness",
    text: "I want what I build to reduce friction, solve a real need, or help someone move easier.",
  },
  {
    title: "Empathy",
    text: "Good systems should consider the people who use them, including needs that are not visible at first.",
  },
];

const heroHighlightCards = [
  { title: "Informatics Engineering", text: "Universitas Brawijaya" },
  { title: "TELADAN Scholar", text: "Leadership development program by Tanoto Foundation" },
  { title: "System Builder", text: "Android · Automation · AI · Network Systems" },
  { title: "Self-Symbol", text: "Core Server" },
];

const empathyHighlightCards = [
  { title: "Empathy", text: "Noticing the people behind the system." },
  { title: "Accessibility", text: "Making information reachable for different needs." },
  { title: "Usefulness", text: "Building things that help in real situations." },
  { title: "Social Intelligence", text: "Reading context, needs, and tension with care." },
];

const routeTimelineCards = [
  { title: "Poltek SSN preparation", text: "A route I prepared for seriously." },
  { title: "Health selection", text: "The stage where the route changed." },
  { title: "UTBK pivot", text: "A short, intense period of rebuilding direction." },
  { title: "Informatics UB", text: "A conscious choice to keep the mission alive." },
];

const chosenPathImages = [
  { title: "High school technology competition", text: "IT knowledge competition moment.", imageKey: "highSchoolWinner", image: media.highSchoolWinner },
  { title: "OSN certificate", text: "Informatics Olympiad certificate.", imageKey: "highSchoolCertificate", image: media.highSchoolCertificate },
];

const manyThingsImages = [
  { title: "TELADAN scholarship moment", text: "A scholarship and growth moment.", imageKey: "tanoto", image: media.tanoto },
  { title: "Speaking and mentoring moment", text: "A moment of speaking and sharing.", imageKey: "speakerTeladan", image: media.speakerTeladan },
  { title: "Camp Daniel leadership moment", text: "A leadership and community moment.", imageKey: "campDanielWide", image: media.campDanielWide },
];

function mapPublicProject(project: PublicProject, staticProject?: Project): Project {
  return {
    slug: project.slug,
    title: project.title,
    ecosystem: project.ecosystem ?? undefined,
    category: project.category as Project["category"],
    priority: project.priority as Project["priority"],
    summary: project.summary,
    problem: project.problem,
    solution: project.solution,
    role: project.roles,
    status: project.status as Project["status"],
    techStack: project.techStack,
    links: {
      demo: project.links.demo,
      github: project.links.github,
      download: project.links.download,
    },
    images: project.images.length > 0 ? project.images : staticProject?.images ?? [],
    learnings: project.learnings,
  };
}

function mapPublicExperience(experience: PublicExperience, staticExperience?: Experience): Experience {
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
  };
}

function resolveCtaHref(value: string, fallback: string) {
  const href = value || fallback;
  return href === "resume" ? media.cv : href;
}

function ctaTarget(href: string) {
  return href.startsWith("/") ? { to: href } : { href };
}

export function Home() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [apiProjects, setApiProjects] = useState<PublicProject[] | null>(null);
  const [apiExperiences, setApiExperiences] = useState<PublicExperience[] | null>(null);
  const [homePage, setHomePage] = useState<PublicSitePage | null>(null);
  const staticProjectBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), []);
  const staticExperienceBySlug = useMemo(() => new Map(experiences.map((experience) => [experience.slug, experience])), []);
  const homeSections = useMemo(() => resolveSections("home", homePage), [homePage]);
  const hero = sectionCopy(homeSections, "hero");
  const heroSettings = sectionSettings(homeSections, "hero");
  const empathySettings = sectionSettings(homeSections, "empathy");
  const featuredProjectsSettings = sectionSettings(homeSections, "featured-projects");
  const featuredExperiencesSettings = sectionSettings(homeSections, "featured-experiences");
  const closingSettings = sectionSettings(homeSections, "closing");
  const routeChanged = sectionCopy(homeSections, "route-changed");
  const routeMission = sectionCopy(homeSections, "route-mission");
  const ssnRouteNote = sectionCopy(homeSections, "ssn-route-note");
  const rebuildingDirection = sectionCopy(homeSections, "rebuilding-direction");
  const manyThings = sectionCopy(homeSections, "many-things");
  const quietPattern = sectionCopy(homeSections, "quiet-pattern");
  const valuesTogether = sectionCopy(homeSections, "values-together");
  const mission = sectionCopy(homeSections, "mission");
  const missionPreface = sectionCopy(homeSections, "mission-preface");
  const missionAlignment = sectionCopy(homeSections, "mission-alignment");
  const missionApplication = sectionCopy(homeSections, "mission-application");
  const musicSection = sectionCopy(homeSections, "music");
  const coreMapSection = sectionCopy(homeSections, "core-server-map");
  const explorerSection = sectionCopy(homeSections, "explorer");
  const matchmakerSection = sectionCopy(homeSections, "project-matchmaker");
  const routeModalSection = sectionCopy(homeSections, "route-modal");
  const musicSettings = sectionSettings(homeSections, "music");
  const coreMapSettings = sectionSettings(homeSections, "core-server-map");
  const routeModalSettings = sectionSettings(homeSections, "route-modal");
  const heroBody = bodyParagraphs(hero.body);
  const heroTagline = heroBody.at(-1) ?? "I let things flow, but I stand my ground.";
  const heroPremise = settingString(
    heroSettings,
    "premise",
    "Those roles mattered, but they are not the whole story. This portfolio is about the pattern behind them: how I think, respond, build, and grow through real problems.",
  );
  const heroProfileImage = settingImage(heroSettings, cmsImageByKey, media.profile);
  const heroProfileName = settingString(heroSettings, "profileName", "Oktavianus Samuel Minarto");
  const heroProfileHeadline = settingString(heroSettings, "profileHeadline", "A steady mind who builds systems that help");
  const heroProfileMeta = settingString(heroSettings, "profileMeta", "Informatics Engineering · Universitas Brawijaya");
  const heroProfileTags = settingString(heroSettings, "profileTags", "TELADAN Scholar · Android · Automation · Network");
  const heroSymbolTitle = settingString(heroSettings, "symbolTitle", "Self-symbol · Core Server");
  const heroSymbolBody = settingString(heroSettings, "symbolBody", "A visual metaphor for how I try to keep systems clear, connected, and useful.");
  const empathyImage = settingImage(empathySettings, cmsImageByKey, media.pldVolunteer);
  const rebuildingImage = settingImage(sectionSettings(homeSections, "rebuilding-direction"), cmsImageByKey, media.tanoto);
  const heroPrimaryHref = resolveCtaHref(settingString(heroSettings, "primaryCtaHref"), "/#story");
  const heroSecondaryHref = resolveCtaHref(settingString(heroSettings, "secondaryCtaHref"), "/projects");
  const heroIdentityHref = resolveCtaHref(settingString(heroSettings, "identityCtaHref"), "/#identity");
  const heroHighlights = useMemo(() => cardBlocks(homeSections, "hero", heroHighlightCards), [homeSections]);
  const projectsCtaHref = resolveCtaHref(settingString(featuredProjectsSettings, "ctaHref"), "/projects");
  const experiencesCtaHref = resolveCtaHref(settingString(featuredExperiencesSettings, "ctaHref"), "/experiences");
  const closingPrimaryHref = resolveCtaHref(settingString(closingSettings, "primaryCtaHref"), "/projects");
  const closingSecondaryHref = resolveCtaHref(settingString(closingSettings, "secondaryCtaHref"), "resume");
  const closingTertiaryHref = resolveCtaHref(settingString(closingSettings, "tertiaryCtaHref"), "/contact");
  const homeEarlyCards = useMemo(
    () =>
      cardBlocks(homeSections, "early-story", earlyCards).map((card, index) => ({
        ...card,
        image: card.imageUrl ?? (card.imageKey ? cardImageByKey[card.imageKey] ?? earlyCards[index]?.image ?? media.profile : earlyCards[index]?.image ?? media.profile),
      })),
    [homeSections],
  );
  const homeSelectionCards = useMemo(
    () =>
      cardBlocks(homeSections, "ssn-route", selectionCards).map((card, index) => ({
        ...card,
        image: card.imageUrl ?? (card.imageKey ? cardImageByKey[card.imageKey] ?? selectionCards[index]?.image ?? media.ssnStudy : selectionCards[index]?.image ?? media.ssnStudy),
      })),
    [homeSections],
  );
  const homeChosenPathImages = useMemo(
    () =>
      cardBlocks(homeSections, "chosen-path", chosenPathImages).map((card, index) => ({
        ...card,
        image: card.imageUrl ?? (card.imageKey ? cardImageByKey[card.imageKey] ?? chosenPathImages[index]?.image ?? media.highSchoolWinner : chosenPathImages[index]?.image ?? media.highSchoolWinner),
      })),
    [homeSections],
  );
  const homeManyThingsImages = useMemo(
    () =>
      cardBlocks(homeSections, "many-things", manyThingsImages).map((card, index) => ({
        ...card,
        image: card.imageUrl ?? (card.imageKey ? cardImageByKey[card.imageKey] ?? manyThingsImages[index]?.image ?? media.tanoto : manyThingsImages[index]?.image ?? media.tanoto),
      })),
    [homeSections],
  );
  const homeRouteTimeline = useMemo(() => cardBlocks(homeSections, "route-mission", routeTimelineCards), [homeSections]);
  const homeEmpathyHighlights = useMemo(() => cardBlocks(homeSections, "empathy", empathyHighlightCards), [homeSections]);
  const homeValues = useMemo(() => cardBlocks(homeSections, "values", values), [homeSections]);
  const homeProjects = useMemo(
    () =>
      apiProjects
        ?.filter((project) => project.isFeatured)
        .map((project) => mapPublicProject(project, staticProjectBySlug.get(project.slug)))
        .slice(0, 3) ?? featuredProjects.slice(0, 3),
    [apiProjects, staticProjectBySlug],
  );
  const homeExperiences = useMemo(
    () =>
      apiExperiences
        ?.filter((experience) => experience.isFeatured)
        .map((experience) => mapPublicExperience(experience, staticExperienceBySlug.get(experience.slug)))
        .slice(0, 3) ?? featuredExperiences.slice(0, 3),
    [apiExperiences, staticExperienceBySlug],
  );
  const sectionTitleStyle = (key: string) => ({ textAlign: settingTextAlign(sectionSettings(homeSections, key), "titleAlign") });
  const sectionBodyStyle = (key: string) => ({ textAlign: settingTextAlign(sectionSettings(homeSections, key), "bodyAlign") });
  const sectionHeaderAlign = (key: string) => ({
    titleAlign: settingTextAlign(sectionSettings(homeSections, key), "titleAlign"),
    descriptionAlign: settingTextAlign(sectionSettings(homeSections, key), "bodyAlign"),
  });

  useEffect(() => {
    let active = true;

    publicApi.projects().then((response) => {
      if (active && response.data.length > 0) setApiProjects(response.data);
    }).catch(() => undefined);

    publicApi.experiences().then((response) => {
      if (active && response.data.length > 0) setApiExperiences(response.data);
    }).catch(() => undefined);

    publicApi.page("home").then((response) => {
      if (active) setHomePage(response.data);
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy-wrap">
            <h1>
              {(hero.title ?? "").split("\n").slice(0, -1).map((line) => (
                <Fragment key={line}>
                  {line}
                  <br />
                </Fragment>
              ))}
              <span>{(hero.title ?? "").split("\n").at(-1)}</span>
            </h1>
            <p className="hero-copy">
              {heroBody.slice(0, -1).map((paragraph, index) => (
                <span key={paragraph}>
                  {index > 0 ? (
                    <>
                      <br />
                      <br />
                    </>
                  ) : null}
                  <FormattedText text={paragraph} />
                </span>
              ))}
            </p>
            <div className="hero-premise">
              <FormattedText text={heroPremise} />
            </div>
            <div className="tagline"><FormattedText text={heroTagline} /></div>
            <div className="hero-highlight-grid" aria-label="Portfolio profile highlights">
              {heroHighlights.map((item) => (
                <div className="hero-highlight-card" key={item.title}>
                  <strong>{item.title}</strong>
                  <span><FormattedText text={item.text} /></span>
                </div>
              ))}
            </div>
            <div className="actions">
              <Button {...ctaTarget(heroPrimaryHref)} variant="primary">
                {settingString(heroSettings, "primaryCtaLabel", "Explore My Story")} <ArrowRight size={16} />
              </Button>
              <Button {...ctaTarget(heroIdentityHref)}>{settingString(heroSettings, "identityCtaLabel", "Who Am I?")}</Button>
              <Button {...ctaTarget(heroSecondaryHref)}>{settingString(heroSettings, "secondaryCtaLabel", "View Projects")}</Button>
              <button className="quick-route-button" type="button" onClick={() => setIsExplorerOpen(true)}>
                <Compass size={16} /> {settingString(heroSettings, "tertiaryCtaLabel", "Choose Route")}
              </button>
            </div>
          </div>
          <div className="hero-visual-stack">
            <div className="profile-strip hero-profile-card">
              <img src={heroProfileImage} alt="Oktavianus Samuel Minarto" />
              <div>
                <strong>{heroProfileName}</strong>
                <span><FormattedText text={heroProfileHeadline} /></span>
                <span><FormattedText text={heroProfileMeta} /></span>
                <span><FormattedText text={heroProfileTags} /></span>
              </div>
            </div>
            <div className="server-symbol-card">
              <ServerVisual />
              <div className="symbol-caption">
                <strong>{heroSymbolTitle}</strong>
                <span><FormattedText text={heroSymbolBody} /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="story">
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "early-story").subtitle ?? ""}
            title={sectionCopy(homeSections, "early-story").title ?? ""}
            description={sectionCopy(homeSections, "early-story").body ?? ""}
            {...sectionHeaderAlign("early-story")}
          />
          <div className="memory-grid">
            {homeEarlyCards.map((card) => (
              <Card className="memory-card" key={card.title}>
                <img src={card.image} alt={card.title} loading="lazy" />
                <div>
                  <h3>{card.title}</h3>
                  <p><FormattedText text={card.text} /></p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">{sectionCopy(homeSections, "chosen-path").subtitle}</div>
            <h2 style={sectionTitleStyle("chosen-path")}>{sectionCopy(homeSections, "chosen-path").title}</h2>
            {bodyParagraphs(sectionCopy(homeSections, "chosen-path").body).slice(0, -1).map((paragraph, index) => (
              <p className="section-desc with-space" style={sectionBodyStyle("chosen-path")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
            <div className="highlight-line" style={sectionBodyStyle("chosen-path")}><FormattedText text={bodyParagraphs(sectionCopy(homeSections, "chosen-path").body).at(-1) ?? ""} /></div>
          </div>
          <div className="photo-collage">
            {homeChosenPathImages.map((image) => (
              <img src={image.image} alt={image.title} key={image.title} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <section id="identity">
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "ssn-route").subtitle ?? ""}
            title={sectionCopy(homeSections, "ssn-route").title ?? ""}
            description={sectionCopy(homeSections, "ssn-route").body ?? ""}
            {...sectionHeaderAlign("ssn-route")}
          />
          <div className="selection-layout">
            <div className="grid grid-3">
              {homeSelectionCards.map((card) => (
                <Card className="memory-card" key={card.title}>
                  <img src={card.image} alt={card.title} loading="lazy" />
                  <div>
                    <h3>{card.title}</h3>
                    <p><FormattedText text={card.text} /></p>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="route-card">
              {bodyParagraphs(ssnRouteNote.body).map((paragraph) => (
                <p key={paragraph}><FormattedText text={paragraph} /></p>
              ))}
            </Card>
          </div>
        </div>
      </section>

      <section>
        <div className="container split">
          <Card className="big-quote">
            <p style={sectionTitleStyle("route-changed")}>{routeChanged.title}</p>
          </Card>
          <div>
            <div className="section-kicker">{routeChanged.subtitle}</div>
            {bodyParagraphs(routeChanged.body).map((paragraph, index) => (
              <p className="section-desc with-space" style={sectionBodyStyle("route-changed")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <Card className="big-quote">
            <p style={sectionTitleStyle("route-mission")}>
              {(routeMission.title ?? "").split("\n").map((line, index, lines) => (
                <Fragment key={line}>
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </p>
          </Card>
          <div className="thin-divider" />
          <div className="route-timeline" aria-label="Route transition timeline">
            {homeRouteTimeline.map((step) => (
              <span key={step.title}>{step.title}</span>
            ))}
          </div>
          {bodyParagraphs(routeMission.body).map((paragraph, index) => (
            <p className="section-desc wide with-space" style={sectionBodyStyle("route-mission")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
          ))}
        </div>
      </section>

      <section id="rebuilding-direction">
        <div className="container split">
          <div>
            <div className="section-kicker">{rebuildingDirection.subtitle}</div>
            <h2 style={sectionTitleStyle("rebuilding-direction")}>{rebuildingDirection.title}</h2>
            {bodyParagraphs(rebuildingDirection.body).map((paragraph, index) => (
              <p className="section-desc with-space" style={sectionBodyStyle("rebuilding-direction")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </div>
          <Card className="image-card tall">
            <img src={rebuildingImage} alt="TELADAN scholarship journey" loading="lazy" />
          </Card>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">{manyThings.subtitle}</div>
            <h2 style={sectionTitleStyle("many-things")}>{manyThings.title}</h2>
            {bodyParagraphs(manyThings.body).map((paragraph, index) => (
              <p className="section-desc with-space" style={sectionBodyStyle("many-things")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </div>
          <div className="stacked-photos">
            {homeManyThingsImages.map((image) => (
              <img src={image.image} alt={image.title} key={image.title} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container narrative">
          {bodyParagraphs(quietPattern.body).map((paragraph, index) => (
            <p className={index % 2 === 1 ? "muted" : undefined} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
          ))}
        </div>
      </section>

      <section>
        <div className="container">
          <Card className="identity-card">
            <div className="section-kicker">{sectionCopy(homeSections, "identity").subtitle}</div>
            <h2 style={sectionTitleStyle("identity")}>{sectionCopy(homeSections, "identity").title}</h2>
            {bodyParagraphs(sectionCopy(homeSections, "identity").body).map((paragraph, index) => (
              <p style={sectionBodyStyle("identity")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </Card>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">{sectionCopy(homeSections, "empathy").subtitle}</div>
            <h2 style={sectionTitleStyle("empathy")}>{sectionCopy(homeSections, "empathy").title}</h2>
            <div className="highlight-pills empathy-pills" aria-label="Empathy section keywords">
              {homeEmpathyHighlights.map((item) => (
                <span key={item.title}>{item.title}</span>
              ))}
            </div>
            {bodyParagraphs(sectionCopy(homeSections, "empathy").body).map((paragraph, index) => (
              <p className="section-desc with-space" style={sectionBodyStyle("empathy")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </div>
          <Card className="image-card tall pld-photo-card">
            <img src={empathyImage} alt="Volunteer experience at Pusat Layanan Disabilitas UB" loading="lazy" />
          </Card>
        </div>
      </section>

      <section id="values">
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "values").subtitle ?? ""}
            title={sectionCopy(homeSections, "values").title ?? ""}
            description={sectionCopy(homeSections, "values").body ?? ""}
            {...sectionHeaderAlign("values")}
          />
          <div className="grid grid-4">
            {homeValues.map((value) => (
              <Card key={value.title}>
                <h3>{value.title}</h3>
                <p><FormattedText text={value.text} /></p>
              </Card>
            ))}
          </div>
          <Card className="values-together-card">
            <div className="section-kicker">{valuesTogether.subtitle}</div>
            <h3 style={sectionTitleStyle("values-together")}>{valuesTogether.title}</h3>
            {bodyParagraphs(valuesTogether.body).map((paragraph, index) => (
              <p style={sectionBodyStyle("values-together")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </Card>
        </div>
      </section>

      <section className="mission-section" id="mission">
        <div className="container mission-layout">
          <Card className="mission-preface-card">
            <div className="section-kicker">{missionPreface.subtitle}</div>
            <h3 style={sectionTitleStyle("mission-preface")}>{missionPreface.title}</h3>
            {bodyParagraphs(missionPreface.body).map((paragraph, index) => (
              <p style={sectionBodyStyle("mission-preface")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </Card>

          <div className="mission-statement">
            <div className="section-kicker">{mission.subtitle}</div>
            <h2 style={sectionTitleStyle("mission")}>{mission.title}</h2>
          </div>

          <div className="mission-explanation-grid">
            <Card className="mission-explanation-card">
              <div className="section-kicker">{missionAlignment.subtitle}</div>
              <h3 style={sectionTitleStyle("mission-alignment")}>{missionAlignment.title}</h3>
              {bodyParagraphs(missionAlignment.body).map((paragraph, index) => (
                <p style={sectionBodyStyle("mission-alignment")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
              ))}
            </Card>
            <Card className="mission-explanation-card">
              <div className="section-kicker">{missionApplication.subtitle}</div>
              <h3 style={sectionTitleStyle("mission-application")}>{missionApplication.title}</h3>
              {bodyParagraphs(missionApplication.body).map((paragraph, index) => (
                <p style={sectionBodyStyle("mission-application")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
              ))}
            </Card>
          </div>

          <div className="mission-body-copy">
            {bodyParagraphs(mission.body).map((paragraph, index) => (
              <p style={sectionBodyStyle("mission")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "featured-projects").subtitle ?? ""}
            title={sectionCopy(homeSections, "featured-projects").title ?? ""}
            description={sectionCopy(homeSections, "featured-projects").body ?? ""}
            {...sectionHeaderAlign("featured-projects")}
          />
          <div className="grid grid-3">
            {homeProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
          <div className="actions">
            <Button {...ctaTarget(projectsCtaHref)} variant="primary">
              {settingString(featuredProjectsSettings, "ctaLabel", "Explore My Projects")} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "featured-experiences").subtitle ?? ""}
            title={sectionCopy(homeSections, "featured-experiences").title ?? ""}
            description={sectionCopy(homeSections, "featured-experiences").body ?? ""}
            {...sectionHeaderAlign("featured-experiences")}
          />
          <div className="grid grid-3">
            {homeExperiences.map((experience) => (
              <ExperienceCard key={experience.slug} experience={experience} />
            ))}
          </div>
          <div className="actions">
            <Button {...ctaTarget(experiencesCtaHref)} variant="primary">
              {settingString(featuredExperiencesSettings, "ctaLabel", "See My Experiences")} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <CoreServerMap
        kicker={coreMapSection.subtitle}
        title={coreMapSection.title}
        body={coreMapSection.body}
        selectedKicker={settingString(coreMapSettings, "selectedKicker", "Selected node")}
        centerLabel={settingString(coreMapSettings, "centerLabel", "Core Server")}
        linkLabel={settingString(coreMapSettings, "linkLabel", "Open related page")}
      />

      <HomeMusicSection
        kicker={musicSection.subtitle}
        title={musicSection.title}
        body={musicSection.body}
        blockedMessage={settingString(musicSettings, "blockedMessage", "Autoplay was blocked by the browser. Press play to start the soundtrack.")}
      />

      <PortfolioExplorer
        kicker={explorerSection.subtitle}
        title={explorerSection.title}
        body={explorerSection.body}
        matchmakerKicker={matchmakerSection.subtitle}
        matchmakerTitle={matchmakerSection.title}
        matchmakerBody={bodyParagraphs(matchmakerSection.body)[0]}
        matchmakerHelper={bodyParagraphs(matchmakerSection.body)[1]}
      />

      <section className="closing-section">
        <div className="container">
          <div className="section-kicker">{sectionCopy(homeSections, "closing").subtitle}</div>
          <h2 style={sectionTitleStyle("closing")}>{sectionCopy(homeSections, "closing").title}</h2>
          {bodyParagraphs(sectionCopy(homeSections, "closing").body).slice(0, -1).map((paragraph, index) => (
            <p style={sectionBodyStyle("closing")} key={`${paragraph}-${index}`}><FormattedText text={paragraph} /></p>
          ))}
          <h2 className="closing-line" style={sectionBodyStyle("closing")}><FormattedText text={bodyParagraphs(sectionCopy(homeSections, "closing").body).at(-1) ?? ""} /></h2>
          <div className="actions centered">
            <Button {...ctaTarget(closingPrimaryHref)} variant="primary">
              {settingString(closingSettings, "primaryCtaLabel", "View Projects")}
            </Button>
            <Button
              {...ctaTarget(closingSecondaryHref)}
              download={closingSecondaryHref === media.cv ? "Oktavianus-Samuel-Minarto-CV.pdf" : undefined}
            >
              <Download size={16} /> {settingString(closingSettings, "secondaryCtaLabel", "Download Resume")}
            </Button>
            <Button {...ctaTarget(closingTertiaryHref)}>
              <Mail size={16} /> {settingString(closingSettings, "tertiaryCtaLabel", "Contact Me")}
            </Button>
          </div>
        </div>
      </section>

      <PortfolioExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        kicker={routeModalSection.subtitle}
        title={routeModalSection.title}
        body={routeModalSection.body}
        primaryLinkLabel={settingString(routeModalSettings, "primaryCtaLabel", "Continue the story")}
        secondaryLinkLabel={settingString(routeModalSettings, "secondaryCtaLabel", "See full explorer later")}
      />
    </>
  );
}
