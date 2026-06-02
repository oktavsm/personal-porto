import { ArrowRight, Compass, Download, Mail } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ExperienceCard } from "../components/ExperienceCard";
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
import { bodyParagraphs, cardBlocks, resolveSections, sectionCopy } from "../lib/siteContent";

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
};

const selectionCards = [
  { title: "SKD Preparation", image: media.ssnStudy, text: "Learning discipline, consistency, and test strategy." },
  { title: "Academic Test", image: media.ssnAfterAcademic, text: "Facing mathematics and English as the next gate." },
  { title: "Health Selection", image: media.ssnHealth, text: "The stage where the route finally changed." },
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

export function Home() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [apiProjects, setApiProjects] = useState<PublicProject[] | null>(null);
  const [apiExperiences, setApiExperiences] = useState<PublicExperience[] | null>(null);
  const [homePage, setHomePage] = useState<PublicSitePage | null>(null);
  const staticProjectBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), []);
  const staticExperienceBySlug = useMemo(() => new Map(experiences.map((experience) => [experience.slug, experience])), []);
  const homeSections = useMemo(() => resolveSections("home", homePage), [homePage]);
  const hero = sectionCopy(homeSections, "hero");
  const heroBody = bodyParagraphs(hero.body);
  const heroTagline = heroBody.at(-1) ?? "I let things flow, but I stand my ground.";
  const homeEarlyCards = useMemo(
    () =>
      cardBlocks(homeSections, "early-story", earlyCards).map((card, index) => ({
        ...card,
        image: card.imageUrl ?? (card.imageKey ? cardImageByKey[card.imageKey] ?? earlyCards[index]?.image ?? media.profile : earlyCards[index]?.image ?? media.profile),
      })),
    [homeSections],
  );
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
            <div className="eyebrow">
              <span className="pulse" /> {hero.subtitle}
            </div>
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
                  {paragraph}
                </span>
              ))}
            </p>
            <div className="tagline">{heroTagline}</div>
            <div className="actions">
              <Button to="/#story" variant="primary">
                Explore My Story <ArrowRight size={16} />
              </Button>
              <Button to="/projects">View Projects</Button>
              <button className="quick-route-button" type="button" onClick={() => setIsExplorerOpen(true)}>
                <Compass size={16} /> Choose Route
              </button>
            </div>
          </div>
          <div className="hero-visual-stack">
            <ServerVisual />
            <div className="profile-strip">
              <img src={media.profile} alt="Oktavianus Samuel Minarto" />
              <div>
                <strong>A steady mind who builds systems that help</strong>
                <span>Informatics Engineering · Universitas Brawijaya</span>
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
          />
          <div className="memory-grid">
            {homeEarlyCards.map((card) => (
              <Card className="memory-card" key={card.title}>
                <img src={card.image} alt={card.title} loading="lazy" />
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
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
            <h2>{sectionCopy(homeSections, "chosen-path").title}</h2>
            {bodyParagraphs(sectionCopy(homeSections, "chosen-path").body).slice(0, -1).map((paragraph) => (
              <p className="section-desc with-space" key={paragraph}>{paragraph}</p>
            ))}
            <div className="highlight-line">{bodyParagraphs(sectionCopy(homeSections, "chosen-path").body).at(-1)}</div>
          </div>
          <div className="photo-collage">
            <img src={media.highSchoolWinner} alt="High school technology competition" loading="lazy" />
            <img src={media.highSchoolCertificate} alt="OSN certificate" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="who-am-i">
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "ssn-route").subtitle ?? ""}
            title={sectionCopy(homeSections, "ssn-route").title ?? ""}
            description={sectionCopy(homeSections, "ssn-route").body ?? ""}
          />
          <div className="selection-layout">
            <div className="grid grid-3">
              {selectionCards.map((card) => (
                <Card className="memory-card" key={card.title}>
                  <img src={card.image} alt={card.title} loading="lazy" />
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="route-card">
              <p>
                The process started with SKD preparation, academic tests, and every stage that made the dream feel
                closer. One by one, I passed the early stages.
              </p>
              <p>For a moment, it felt like the route I had built for years was finally opening.</p>
            </Card>
          </div>
        </div>
      </section>

      <section>
        <div className="container split">
          <Card className="big-quote">
            <p>But not every path opens the way we expect.</p>
          </Card>
          <div>
            <div className="section-kicker">When the route changed</div>
            <p className="section-desc">
              The selection process started well. I passed SKD. I passed the academic test. Then came the health
              selection — the stage where everything changed.
              <br />
              <br />
              It hurt, because it was not only a failed selection. It felt like losing a version of myself that I had
              been building for years.
              <br />
              <br />
              The dream was still there, but the route had to change.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <Card className="big-quote">
            <p>
              The route changed.
              <br />
              The mission didn&apos;t.
            </p>
          </Card>
          <div className="thin-divider" />
          <p className="section-desc wide">
            At the last moment, I decided to take UTBK. I started almost from zero, because I had never fully prepared
            for that path before. In around one and a half months, I joined more than 20 tryouts, reviewed my mistakes,
            rebuilt my study rhythm, and forced myself to adapt quickly.
            <br />
            <br />
            Eventually, I entered Informatics at Universitas Brawijaya. It was not an escape. It was a conscious choice.
            I realized that my dream did not have to disappear. I could still learn technology, build systems, and
            prepare myself to contribute through software, AI, networks, and maybe one day, government technology.
          </p>
        </div>
      </section>

      <section id="core-values">
        <div className="container split">
          <div>
            <div className="section-kicker">Rebuilding my direction</div>
            <h2>After entering UB, I tried to accelerate my growth.</h2>
            <p className="section-desc with-space">
              Entering Informatics UB gave me a new route, but I knew that I still had to rebuild myself. I started
              applying for scholarships and development opportunities. I was rejected many times, revised my
              applications, improved my essays, reflected on my experiences, and tried again.
            </p>
            <p className="section-desc with-space">
              Eventually, I became a Tanoto Scholar through the TELADAN program. But more than the title, TELADAN became
              a space where I had to ask a deeper question: who am I, beyond everything I have achieved?
            </p>
          </div>
          <Card className="image-card tall">
            <img src={media.tanoto} alt="TELADAN scholarship journey" loading="lazy" />
          </Card>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">Then I became many things</div>
            <h2>From the outside, it looked like progress.</h2>
            <p className="section-desc with-space">
              I became a scholar. I joined organizations. I became a project leader. I joined competitions. I became a
              speaker. I built projects and took more responsibilities.
            </p>
            <p className="section-desc with-space">
              But somewhere along the way, I started to feel tired. I was moving, but not always steering. I was doing
              many things, but I was not always becoming myself.
            </p>
          </div>
          <div className="stacked-photos">
            <img src={media.tanoto} alt="TELADAN scholarship moment" loading="lazy" />
            <img src={media.speakerTeladan} alt="Speaking and mentoring moment" loading="lazy" />
            <img src={media.campDanielWide} alt="Camp Daniel leadership moment" loading="lazy" />
          </div>
        </div>
      </section>

      <section>
        <div className="container narrative">
          <p>When the titles became too loud, I found what stayed quiet.</p>
          <p className="muted">It was never the title.</p>
          <p>It was the moment when something I built actually helped someone.</p>
          <p className="muted">
            A small script. An automation. A mobile app. A tool that reduces repetitive work. A system that makes
            scattered things easier to use.
          </p>
          <p>Since my first semester, I have built small tools and projects not because they were impressive, but because they solved something around me.</p>
          <p className="muted">That is where I feel most like myself.</p>
        </div>
      </section>

      <section>
        <div className="container">
          <Card className="identity-card">
            <div className="section-kicker">{sectionCopy(homeSections, "identity").subtitle}</div>
            <h2>{sectionCopy(homeSections, "identity").title}</h2>
            {bodyParagraphs(sectionCopy(homeSections, "identity").body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Card>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">{sectionCopy(homeSections, "empathy").subtitle}</div>
            <h2>{sectionCopy(homeSections, "empathy").title}</h2>
            {bodyParagraphs(sectionCopy(homeSections, "empathy").body).map((paragraph) => (
              <p className="section-desc with-space" key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Card className="image-card tall pld-photo-card">
            <img src={media.pldVolunteer} alt="Volunteer experience at Pusat Layanan Disabilitas UB" loading="lazy" />
          </Card>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "values").subtitle ?? ""}
            title={sectionCopy(homeSections, "values").title ?? ""}
            description={sectionCopy(homeSections, "values").body ?? ""}
          />
          <div className="grid grid-4">
            {homeValues.map((value) => (
              <Card key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mission-section" id="mission">
        <div className="container">
          <div className="section-kicker">{sectionCopy(homeSections, "mission").subtitle}</div>
          <h2>{sectionCopy(homeSections, "mission").title}</h2>
          {bodyParagraphs(sectionCopy(homeSections, "mission").body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker={sectionCopy(homeSections, "featured-projects").subtitle ?? ""}
            title={sectionCopy(homeSections, "featured-projects").title ?? ""}
            description={sectionCopy(homeSections, "featured-projects").body ?? ""}
          />
          <div className="grid grid-3">
            {homeProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
          <div className="actions">
            <Button to="/projects" variant="primary">
              Explore My Projects <ArrowRight size={16} />
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
          />
          <div className="grid grid-3">
            {homeExperiences.map((experience) => (
              <ExperienceCard key={experience.slug} experience={experience} />
            ))}
          </div>
          <div className="actions">
            <Button to="/experiences" variant="primary">
              See My Experiences <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <CoreServerMap />

      <PortfolioExplorer />

      <HomeMusicSection />

      <section className="closing-section">
        <div className="container">
          <div className="section-kicker">{sectionCopy(homeSections, "closing").subtitle}</div>
          <h2>{sectionCopy(homeSections, "closing").title}</h2>
          {bodyParagraphs(sectionCopy(homeSections, "closing").body).slice(0, -1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h2 className="closing-line">{bodyParagraphs(sectionCopy(homeSections, "closing").body).at(-1)}</h2>
          <div className="actions centered">
            <Button to="/projects" variant="primary">
              View Projects
            </Button>
            <Button href={media.cv}>
              <Download size={16} /> Download Resume
            </Button>
            <Button to="/contact">
              <Mail size={16} /> Contact Me
            </Button>
          </div>
        </div>
      </section>

      <PortfolioExplorerModal isOpen={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} />
    </>
  );
}
