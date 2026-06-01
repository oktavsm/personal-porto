import { ArrowRight, Download, Mail } from "lucide-react";
import { ExperienceCard } from "../components/ExperienceCard";
import { HomeMusicSection } from "../components/MusicPlayer";
import { ProjectCard } from "../components/ProjectCard";
import { SectionHeader } from "../components/SectionHeader";
import { ServerVisual } from "../components/ServerVisual";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { media } from "../data/media";
import { featuredExperiences } from "../data/experiences";
import { featuredProjects } from "../data/projects";

const earlyCards = [
  { title: "Silat", image: media.earlySilat, text: "Discipline, physical control, consistency, and courage to train through repetition." },
  { title: "PMR & Jumbara", image: media.earlyPmr, text: "Care, independence, service, and perspective beyond my daily environment." },
  { title: "Pramuka / OSIS", image: media.earlyPramuka, text: "Responsibility, teamwork, and early experience in leading and organizing people." },
  { title: "Competitions", image: media.highSchoolWinner, text: "Focus, growth, and courage to test myself through challenges." },
];

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

export function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy-wrap">
            <div className="eyebrow">
              <span className="pulse" /> Personal Portfolio · Systems, Stories, and Useful Work
            </div>
            <h1>
              Winner?
              <br />
              Speaker?
              <br />
              Leader?
              <br />
              <span>No, I&apos;m not.</span>
            </h1>
            <p className="hero-copy">
              I&apos;ve been there. But those are not who I am.
              <br />
              <br />
              I&apos;m <strong>Oktavianus Samuel Minarto</strong> — an Informatics student who learns by building,
              thinks in systems, and tries to make scattered things work better.
            </p>
            <div className="tagline">I let things flow, but I stand my ground.</div>
            <div className="actions">
              <Button to="/#story" variant="primary">
                Explore My Story <ArrowRight size={16} />
              </Button>
              <Button to="/projects">View Projects</Button>
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
            kicker="Before I knew myself"
            title="Before I knew who I was, I tried many things."
            description="Since I was young, I joined many activities. Silat, PMR, Jumbara, Pramuka, OSIS, and competitions taught me discipline, independence, care, responsibility, focus, and growth. But at that time, I was still too young to define who I was. I was only collecting pieces of myself."
          />
          <div className="memory-grid">
            {earlyCards.map((card) => (
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
            <div className="section-kicker">A path I chose early</div>
            <h2>Then I found a path I wanted to fight for.</h2>
            <p className="section-desc with-space">
              In high school, I started to take technology seriously. I joined Informatics Olympiad and IT knowledge
              competitions. I began to see technology not only as something I liked, but as a path I wanted to pursue.
            </p>
            <p className="section-desc with-space">
              At that time, my dream was clear: Poltek SSN. I wanted to be part of cybersecurity, public service, and
              technology for the country.
            </p>
            <div className="highlight-line">For the first time, I thought: maybe this is really me.</div>
          </div>
          <div className="photo-collage">
            <img src={media.highSchoolWinner} alt="High school technology competition" loading="lazy" />
            <img src={media.highSchoolCertificate} alt="OSN certificate" loading="lazy" />
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker="The selection I prepared for"
            title="For three years, I prepared for one route."
            description="While many of my friends prepared for UTBK, I focused on a different path. I prepared for Poltek SSN because I believed it was the closest route to the future I imagined: technology, cybersecurity, public service, and contribution to the country."
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

      <section>
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
            <div className="section-kicker">So, who am I?</div>
            <h2>A steady mind who turns scattered problems into systems that help.</h2>
            <p>
              I am not defined by the roles I have held. I am defined by the way I think, respond, and build. I am calm,
              but not passive. I think before reacting. I prefer structure over noise. I feel most meaningful when what I
              build can actually help people.
            </p>
          </Card>
        </div>
      </section>

      <section>
        <div className="container split">
          <div>
            <div className="section-kicker">Empathy in practice</div>
            <h2>One early experience changed how I see useful systems.</h2>
            <p className="section-desc with-space">
              One of my earliest university experiences was becoming a volunteer typist at Pusat Layanan Disabilitas
              Universitas Brawijaya. At first, I thought the role was only about typing what the lecturer said. But over
              time, I realized that the real responsibility was bigger than that.
            </p>
            <p className="section-desc with-space">
              I had to listen carefully, capture the meaning, and help lecture information become accessible for someone
              else. That experience taught me that a system is truly useful when it helps people access what they need.
            </p>
          </div>
          <Card className="image-card tall pld-photo-card">
            <img src={media.pldVolunteer} alt="Volunteer experience at Pusat Layanan Disabilitas UB" loading="lazy" />
          </Card>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker="Core values"
            title="What guides the way I build"
            description="These values come from how I learn, work, reflect, and respond to people around me."
          />
          <div className="grid grid-4">
            {values.map((value) => (
              <Card key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="container">
          <div className="section-kicker">My mission</div>
          <h2>To build useful systems that turn scattered problems into structured, accessible, and reliable solutions.</h2>
          <p>
            Right now, I do this through software engineering, Android development, automation, AI, and network systems.
            I am not only interested in building applications. I am interested in understanding the problem, designing
            the flow, connecting the parts, and making sure the system works for real users.
            <br />
            <br />
            For me, software engineering is a way to make scattered things easier to understand, access, and use.
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <SectionHeader
            kicker="Featured works"
            title="Things I build to solve real problems"
            description="I do not build projects just to fill my portfolio. I build them because I notice small frictions around me — and I want to reduce them through software."
          />
          <div className="grid grid-3">
            {featuredProjects.slice(0, 3).map((project) => (
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
            kicker="Experiences"
            title="Experiences that shaped how I build"
            description="These are not just roles. They shaped how I understand people, systems, leadership, and impact."
          />
          <div className="grid grid-3">
            {featuredExperiences.slice(0, 3).map((experience) => (
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

      <section>
        <div className="container symbol-panel">
          <div className="symbol-visual">
            <ServerVisual />
          </div>
          <div className="symbol-content">
            <div className="section-kicker">Self-symbol</div>
            <h2>Why a core server?</h2>
            <p>
              A core server is not always seen, but it keeps the system connected. It receives, processes, organizes,
              and distributes. It supports many connections at once, but still needs structure to keep everything stable.
            </p>
            <p>
              That is why I chose it as my self-symbol — not because I only like technology, but because it reflects how
              I understand myself: someone who tries to create stability, organize complexity, and help systems work
              better.
            </p>
            <Button to="/lead-self#self-symbol" variant="primary">
              Read My Self-Symbol Reflection <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <HomeMusicSection />

      <section className="closing-section">
        <div className="container">
          <div className="section-kicker">Still running</div>
          <h2>This portfolio is still running.</h2>
          <p>
            Like every system, I am still being built, tested, debugged, and improved. I am still learning. Still
            building. Still finding better ways to be useful. For now, this is the clearest version of myself:
          </p>
          <h2 className="closing-line">I build systems that help.</h2>
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
    </>
  );
}
